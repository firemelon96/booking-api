import { startOfDay } from 'date-fns';
import { prisma } from '../../../config/prisma';
import {
  CapacityMode,
  PricingType,
  Prisma,
  Role,
} from '../../../generated/prisma/client';
import { CapacityCtx } from './capacity.type';
import { detectOverbooking } from '../../bookings/booking.query';
import { logAdminWarning } from '../../logs/admin-warning.service';

export async function findCapacityOrFail({ id }: { id: string }) {
  const capacity = await prisma.tourDailyCapacity.findUnique({
    where: { id },
  });

  if (!capacity) {
    throw new Error('Capacity not found');
  }

  return capacity;
}

export async function prepareCapacity({
  tx,
  tourId,
  scheduleId,
  joinerCapacity,
  dates,
}: {
  tx: Prisma.TransactionClient;
  tourId: string;
  joinerCapacity?: number;
  scheduleId: string | null;
  dates: Date[];
}) {
  const scheduleKey = scheduleId ?? 'NO_SCHEDULE';

  const rows = await tx.tourDailyCapacity.findMany({
    where: {
      tourId,
      scheduleKey,
      date: { in: dates },
    },
  });

  const map = new Map(rows.map((r) => [startOfDay(r.date).getTime(), r]));

  for (const date of dates) {
    const key = startOfDay(date).getTime();

    if (!map.has(key)) {
      const created = await tx.tourDailyCapacity.create({
        data: {
          tourId,
          date,
          scheduleKey,
          scheduleId: scheduleId ?? null,
          capacity: joinerCapacity ?? 0,
          booked: 0,
        },
      });

      map.set(key, created);
    }
  }

  return { map, scheduleKey };
}

export async function reserveCapacity({
  tx,
  capacityMode,
  dates,
  participants,
  ctx,
  pricingType,
  role,
  userId,
}: {
  tx: Prisma.TransactionClient;
  capacityMode: CapacityMode;
  dates: Date[];
  participants: number;
  ctx: CapacityCtx;
  pricingType: PricingType;
  role: Role;
  userId: string;
}) {
  const isAdmin = role === 'ADMIN';

  const { hasConflict } = await assertBookingConflicts({
    tx,
    dates,
    ctx,
    capacityMode,
    pricingType,
    isAdmin,
    userId,
  });

  const needsSharedCapacity =
    capacityMode === 'SHARED' ||
    (capacityMode === 'MIXED' && pricingType === 'JOINER');

  if (!needsSharedCapacity) {
    return {
      hasOverbooking: false,
      hasConflict,
    };
  }

  const { hasOverbooking } = await reserveShared({
    tx,
    dates,
    ctx,
    participants,
    isAdmin,
    userId,
  });

  return {
    hasConflict,
    hasOverbooking,
  };
}

async function reserveExclusive({
  tx,
  dates,
  ctx,
  isAdmin,
}: {
  tx: Prisma.TransactionClient;
  dates: Date[];
  ctx: CapacityCtx;
  isAdmin: boolean;
}) {
  for (const date of dates) {
    if (isAdmin) {
      //allow override
      await tx.tourDailyCapacity.updateMany({
        where: {
          date,
          scheduleKey: ctx.scheduleKey,
        },
        data: {
          booked: 1,
          capacity: 1,
        },
      });
      continue;
    }

    const updated = await tx.tourDailyCapacity.updateMany({
      where: {
        date,
        scheduleKey: ctx.scheduleKey,
        booked: 0,
      },
      data: {
        booked: 1,
        capacity: 1,
      },
    });

    if (updated.count === 0) {
      throw new Error('Date is already booked');
    }
  }

  return { hasOverbooking: false };
}

async function reserveShared({
  tx,
  dates,
  ctx,
  participants,
  isAdmin,
  userId,
}: {
  tx: Prisma.TransactionClient;
  dates: Date[];
  ctx: CapacityCtx;
  participants: number;
  isAdmin: boolean;
  userId: string;
}) {
  let hasOverbooking = false;

  for (const date of dates) {
    const row = ctx.map.get(startOfDay(date).getTime());

    if (!row) {
      throw new Error('Capacity row not found');
    }

    const willExceed = detectOverbooking({
      capacity: row.capacity,
      booked: row.booked,
      participants,
    });

    if (isAdmin && willExceed) {
      hasOverbooking = true;

      await logAdminWarning({
        tx,
        actionType: 'OVERBOOKING',
        message: `Admin overbooked on ${date.toISOString()}`,
        tourId: row.tourId,
        actorId: userId,
        metadata: {
          date,
          capacity: row.capacity,
          booked: row.booked,
          attemptedParticipants: participants,
        },
      });
    }

    if (isAdmin) {
      await tx.tourDailyCapacity.update({
        where: {
          tourId_date_scheduleKey: {
            tourId: row.tourId,
            date,
            scheduleKey: ctx.scheduleKey,
          },
        },
        data: {
          booked: {
            increment: participants,
          },
        },
      });
      continue;
    }

    const updated = await tx.tourDailyCapacity.updateMany({
      where: {
        tourId: row.tourId,
        date,
        scheduleKey: ctx.scheduleKey,
        booked: {
          lte: row.capacity - participants,
        },
      },
      data: {
        booked: {
          increment: participants,
        },
      },
    });

    if (updated.count === 0) {
      throw new Error(`Not enough capacity on ${date.toISOString()}`);
    }
  }

  return { hasOverbooking };
}

async function reservePrivate({
  tx,
  dates,
  ctx,
  isAdmin,
  userId,
}: {
  tx: Prisma.TransactionClient;
  dates: Date[];
  ctx: CapacityCtx;
  isAdmin: boolean;
  userId: string;
}) {
  for (const date of dates) {
    const row = ctx.map.get(startOfDay(date).getTime());

    if (!row) {
      throw new Error('Capacity row not found');
    }

    if (isAdmin && row.booked > 0) {
      await logAdminWarning({
        tx,
        actionType: 'FORCED_PRIVATE',
        message: 'Admin forced private over joiners',
        tourId: row.tourId,
        actorId: userId,
        metadata: {
          date,
          existingBooked: row.booked,
        },
      });
    }

    if (isAdmin) {
      await tx.tourDailyCapacity.updateMany({
        where: {
          date,
          scheduleKey: ctx.scheduleKey,
        },
        data: {
          booked: row.capacity,
        },
      });
      continue;
    }

    const updated = await tx.tourDailyCapacity.updateMany({
      where: {
        tourId: row.tourId,
        date,
        scheduleKey: ctx.scheduleKey,
        booked: 0,
      },
      data: {
        booked: row.capacity,
      },
    });

    if (updated.count === 0) {
      throw new Error(
        'Cannot reserve private capacity as the date is already booked',
      );
    }
  }

  return { hasOverbooking: false };
}

export async function releaseCapacity({
  tx,
  dates,
  participants,
  scheduleId,
  tourId,
}: {
  tx: Prisma.TransactionClient;
  dates: Date[];
  participants: number;
  scheduleId?: string | null;
  tourId: string;
}) {
  const scheduleKey = scheduleId ?? 'NO_SCHEDULE';

  for (const date of dates) {
    await tx.tourDailyCapacity.updateMany({
      where: {
        tourId,
        scheduleKey,
        date,
      },
      data: {
        booked: {
          decrement: participants,
        },
      },
    });
  }
}

export async function lockCapacityRows(
  tx: Prisma.TransactionClient,
  {
    tourId,
    dates,
    scheduleKey,
  }: {
    tourId: string;
    dates: Date[];
    scheduleKey: string;
  },
) {
  const result = await tx.$queryRaw<
    {
      id: string;
      capacity: number;
      booked: number;
    }[]
  >`
    SELECT id, capacity, booked
    FROM "TourDailyCapacity"
    WHERE "tourId" = ${tourId}
      AND "scheduleKey" = ${scheduleKey}
      AND "date" IN (${Prisma.join(dates)})
    FOR UPDATE
  `;

  return result;
}

export async function assertBookingConflicts({
  tx,
  dates,
  ctx,
  capacityMode,
  pricingType,
  isAdmin,
  userId,
}: {
  tx: Prisma.TransactionClient;
  dates: Date[];
  ctx: CapacityCtx;
  capacityMode: CapacityMode;
  pricingType: PricingType;
  isAdmin: boolean;
  userId: string;
}) {
  let hasConflict = false;

  for (const date of dates) {
    const row = ctx.map.get(startOfDay(date).getTime());

    if (!row) {
      throw new Error('Capacity row not found');
    }

    if (capacityMode === 'EXCLUSIVE') {
      const hasBooking = row.booked > 0;

      if (hasBooking) {
        hasConflict = true;

        if (!isAdmin) {
          throw new Error('Date already has an existing booking');
        }
      }

      await logAdminWarning({
        tx,
        actionType: 'FORCED_PRIVATE',
        message: 'Admin forced booking on exclusive date',
        tourId: row.tourId,
        actorId: userId,
        metadata: {
          date,
          existingBooked: row.booked,
        },
      });
    }

    if (capacityMode === 'MIXED' && pricingType === 'PRIVATE') {
      if (row.booked > 0) {
        hasConflict = true;

        if (!isAdmin) {
          throw new Error(
            'Cannot create private booking with existing joiners',
          );
        }

        await logAdminWarning({
          tx,
          actionType: 'FORCED_PRIVATE',
          message: 'Admin forced private booking over joiners',
          tourId: row.tourId,
          actorId: userId,
          metadata: {
            date,
            existingBooked: row.booked,
          },
        });
      }
    }

    if (capacityMode === 'MIXED' && pricingType === 'JOINER') {
      const hasPrivateBooking = await tx.booking.findFirst({
        where: {
          tourId: row.tourId,
          scheduleId:
            ctx.scheduleKey === 'NO_SCHEDULE' ? null : ctx.scheduleKey,
          pricingType: 'PRIVATE',
          status: {
            in: ['PENDING', 'CONFIRMED'],
          },
          startDate: {
            lte: date,
          },
          endDate: {
            gte: date,
          },
        },
        select: {
          id: true,
        },
      });

      if (hasPrivateBooking) {
        hasConflict = true;

        if (!isAdmin) {
          throw new Error('Cannot join because a private booking exist');
        }

        await logAdminWarning({
          tx,
          actionType: 'FORCED_PRIVATE',
          message: 'Admin forced joiner booking over private booking',
          tourId: row.tourId,
          actorId: userId,
          metadata: {
            date,
          },
        });
      }
    }
  }

  return {
    hasConflict,
  };
}
