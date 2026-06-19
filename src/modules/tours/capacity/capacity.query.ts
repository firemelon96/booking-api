import { startOfDay } from 'date-fns';
import { prisma } from '../../../config/prisma';
import {
  CapacityMode,
  PricingType,
  Prisma,
  Role,
  TourDailyCapacity,
} from '../../../generated/prisma/client';
import { CapacityCtx } from './capacity.type';
import { detectOverbooking } from '../../bookings/booking.query';
import { logAdminWarning } from '../../logs/admin-warning.service';
import { getScheduleKey } from '../../../utils/helper';

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
  capacity,
  dates,
}: {
  tx: Prisma.TransactionClient;
  tourId: string;
  capacity: number;
  scheduleId?: string | null;
  dates: Date[];
}) {
  const scheduleKey = getScheduleKey(scheduleId);

  await tx.tourDailyCapacity.createMany({
    data: dates.map((date) => ({
      tourId,
      date,
      scheduleId,
      scheduleKey,
      availableSlots: capacity,
      bookedSlots: 0,
    })),
    skipDuplicates: true,
  });
}

export async function reserveCapacity({
  tx,
  rows,
  capacityMode,
  participants,
  pricingType,
  isAdmin,
  userId,
}: {
  tx: Prisma.TransactionClient;
  rows: TourDailyCapacity[];
  capacityMode: CapacityMode;
  participants: number;
  pricingType: PricingType;
  isAdmin: boolean;
  userId: string;
}) {
  switch (capacityMode) {
    case 'EXCLUSIVE':
      return reserveExclusiveTourCapacity(tx, {
        rows,
        isAdmin,
        userId,
      });

    case 'SHARED':
      return reserveSharedTourCapacity(tx, {
        rows,
        isAdmin,
        participants,
        userId,
      });

    case 'MIXED':
      return pricingType === 'PRIVATE'
        ? reserveExclusiveTourCapacity(tx, {
            rows,
            isAdmin,
            userId,
          })
        : reserveMixSharedTourCapacity(tx, {
            rows,
            isAdmin,
            participants,
            userId,
          });

    default:
      throw new Error('Invalid pricing mode');
  }

  // let hasOverbooking = false;
  // let hasAdminOverride = false;
  // const { hasConflict } = await assertBookingConflicts({
  //   tx,
  //   dates,
  //   ctx,
  //   capacityMode,
  //   pricingType,
  //   schedu
  //   isAdmin,
  //   userId,
  // });
  // for (const date of dates) {
  //   const row = await tx.tourDailyCapacity.findFirst({
  //     where: {
  //       tourId,
  //       date,
  //       scheduleId,
  //     },
  //   });

  //   if (!row) {
  //     throw new Error('Capacity not found');
  //   }

  //   const hasBooking = row.bookedSlots > 0;

  //   if (capacityMode === 'EXCLUSIVE' && hasBooking) {
  //     if (!isAdmin) {
  //       throw new Error('Not enough capacity available');
  //     }

  //     hasAdminOverride = true;
  //     hasOverbooking = true;

  //     await logAdminWarning({
  //       tx,
  //       actionType: 'OVERBOOKING',
  //       actorId: userId,
  //       message: `Admin overbook in ${date}`,
  //       tourId,
  //       metadata: row,
  //     });
  //   }

  //   if (capacityMode === 'MIXED' && pricingType === 'PRIVATE' && hasBooking) {
  //     if (!isAdmin) {
  //       throw new Error('Private booking needs exclusive date');
  //     }

  //     hasAdminOverride = true;
  //     hasOverbooking = true;

  //     logAdminWarning({
  //       tx,
  //       actionType: 'FORCED_PRIVATE',
  //       actorId: userId,
  //       tourId,
  //       message: 'Admin forced exclusive in joiner booking',
  //       metadata: row,
  //     });
  //   }

  //   if (capacityMode === 'MIXED' && pricingType === 'JOINER') {
  //     const privateBooking = await tx.tourBooking.findFirst({
  //       where: {
  //         tourId: row.id,
  //         scheduleId,
  //         pricingType: 'PRIVATE',
  //         startDate: { lte: date },
  //         endDate: { gte: date },
  //       },
  //       select: { id: true },
  //     });

  //     if (privateBooking) {
  //       if (!isAdmin) {
  //         throw new Error('Cannot book because exclusive booking exist');
  //       }
  //       hasOverbooking = true;

  //       logAdminWarning({
  //         tx,
  //         actionType: 'FORCED_JOINER',
  //         message: `Admin forced joiner on exclusive booking`,
  //         actorId: userId,
  //         metadata: privateBooking,
  //       });
  //     }
  //   }
  // }

  // const needsSharedCapacity =
  //   capacityMode === 'SHARED' ||
  //   (capacityMode === 'MIXED' && pricingType === 'JOINER');

  // if (!needsSharedCapacity) {
  //   return {
  //     hasOverbooking: false,
  //     hasConflict,
  //   };
  // }

  // const { hasOverbooking } = await reserveShared({
  //   tx,
  //   dates,
  //   ctx,
  //   participants,
  //   isAdmin,
  //   userId,
  // });

  // return {
  //   hasConflict,
  //   hasOverbooking,
  // };
}

async function reserveMixSharedTourCapacity(
  tx: Prisma.TransactionClient,
  {
    rows,
    isAdmin,
    participants,
    userId,
  }: {
    rows: TourDailyCapacity[];
    participants: number;
    isAdmin: Boolean;
    userId: string;
  },
) {
  let hasOverbooking = false;
  let hasAdminOverride = false;

  for (const row of rows) {
    const privateBooking = await tx.tourBooking.findFirst({
      where: {
        tourId: row.tourId,
        pricingType: 'PRIVATE',
        startDate: { lte: row.date },
        endDate: { gte: row.date },
      },
      select: { id: true },
    });

    if (privateBooking) {
      if (!isAdmin) {
        throw new Error('Cannot book because private booking exist');
      }

      hasOverbooking = true;
      hasAdminOverride = true;

      await logAdminWarning({
        tx,
        actionType: 'FORCED_JOINER',
        message: `Admin forced joiner on exclusive booking`,
        actorId: userId,
        tourId: row.tourId,
        metadata: privateBooking,
      });
    }

    await tx.tourDailyCapacity.update({
      where: { id: row.id },
      data: {
        bookedSlots: {
          increment: participants,
        },
      },
    });
  }

  return {
    hasAdminOverride,
    hasOverbooking,
  };
}

async function reserveSharedTourCapacity(
  tx: Prisma.TransactionClient,
  {
    rows,
    isAdmin,
    participants,
    userId,
  }: {
    rows: TourDailyCapacity[];
    participants: number;
    isAdmin: Boolean;
    userId: string;
  },
) {
  let hasOverbooking = false;
  let hasAdminOverride = false;

  for (const row of rows) {
    const remainingSlots = row.availableSlots - row.bookedSlots;

    if (remainingSlots < participants) {
      if (!isAdmin) {
        throw new Error('Not enough slots available');
      }

      hasAdminOverride = true;
      hasOverbooking = true;

      await logAdminWarning({
        tx,
        actionType: 'OVERBOOKING',
        actorId: userId,
        message: `Admin overbook tour in ${row.date}`,
        tourId: row.tourId,
        metadata: { requestParticipants: participants, remainingSlots },
      });
    }

    await tx.tourDailyCapacity.update({
      where: { id: row.id },
      data: {
        bookedSlots: {
          increment: participants,
        },
      },
    });
  }
  return {
    hasAdminOverride,
    hasOverbooking,
  };
}

async function reserveExclusiveTourCapacity(
  tx: Prisma.TransactionClient,
  {
    rows,
    isAdmin,
    userId,
  }: {
    rows: TourDailyCapacity[];
    isAdmin: boolean;
    userId: string;
  },
) {
  let hasOverbooking = false;
  let hasAdminOverride = false;

  for (const row of rows) {
    const hasBooking = row.bookedSlots > 0;

    if (hasBooking) {
      if (!isAdmin) {
        throw new Error('Exclusive booking exist for this date');
      }

      hasAdminOverride = true;
      hasOverbooking = true;

      await logAdminWarning({
        tx,
        actionType: 'FORCED_PRIVATE',
        actorId: userId,
        message: `Admin forced private booking in ${row.date}`,
        tourId: row.tourId,
        metadata: row,
      });
    }

    await tx.tourDailyCapacity.update({
      where: { id: row.id },
      data: {
        bookedSlots: { increment: row.availableSlots },
      },
    });
  }

  return {
    hasAdminOverride,
    hasOverbooking,
  };
}

// async function reserveShared({
//   tx,
//   dates,
//   ctx,
//   participants,
//   isAdmin,
//   userId,
// }: {
//   tx: Prisma.TransactionClient;
//   dates: Date[];
//   ctx: CapacityCtx;
//   participants: number;
//   isAdmin: boolean;
//   userId: string;
// }) {
//   let hasOverbooking = false;

//   for (const date of dates) {
//     const row = ctx.map.get(startOfDay(date).getTime());

//     if (!row) {
//       throw new Error('Capacity row not found');
//     }

//     const willExceed = detectOverbooking({
//       capacity: row.capacity,
//       booked: row.booked,
//       participants,
//     });

//     if (isAdmin && willExceed) {
//       hasOverbooking = true;

//       await logAdminWarning({
//         tx,
//         actionType: 'OVERBOOKING',
//         message: `Admin overbooked on ${date.toISOString()}`,
//         tourId: row.tourId,
//         actorId: userId,
//         metadata: {
//           date,
//           capacity: row.capacity,
//           booked: row.booked,
//           attemptedParticipants: participants,
//         },
//       });
//     }

//     if (isAdmin) {
//       await tx.tourDailyCapacity.update({
//         where: {
//           tourId_date_scheduleKey: {
//             tourId: row.tourId,
//             date,
//             scheduleKey: ctx.scheduleKey,
//           },
//         },
//         data: {
//           booked: {
//             increment: participants,
//           },
//         },
//       });
//       continue;
//     }

//     const updated = await tx.tourDailyCapacity.updateMany({
//       where: {
//         tourId: row.tourId,
//         date,
//         scheduleKey: ctx.scheduleKey,
//         booked: {
//           lte: row.capacity - participants,
//         },
//       },
//       data: {
//         booked: {
//           increment: participants,
//         },
//       },
//     });

//     if (updated.count === 0) {
//       throw new Error(`Not enough capacity on ${date.toISOString()}`);
//     }
//   }

//   return { hasOverbooking };
// }

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
  for (const date of dates) {
    await tx.tourDailyCapacity.updateMany({
      where: {
        tourId,
        scheduleId,
        date,
      },
      data: {
        bookedSlots: {
          decrement: participants,
        },
        availableSlots: 0,
      },
    });
  }
}

export async function lockCapacityRows(
  tx: Prisma.TransactionClient,
  {
    tourId,
    dates,
    scheduleId,
  }: {
    tourId: string;
    dates: Date[];
    scheduleId?: string | null;
  },
) {
  const scheduleKey = getScheduleKey(scheduleId);

  const rows = await tx.$queryRaw<TourDailyCapacity[]>`
    SELECT 1
    FROM "TourDailyCapacity"
    WHERE "tourId" = ${tourId}
    AND "scheduleKey" = ${scheduleKey}
    AND "date" = ANY(${dates})
    FOR UPDATE
  `;

  if (rows.length !== dates.length) {
    throw new Error('Capacity row missing');
  }

  return rows;
}

// export async function assertBookingConflicts({
//   tx,
//   dates,
//   capacityMode,
//   pricingType,
//   isAdmin,
//   userId,
// }: {
//   tx: Prisma.TransactionClient;
//   dates: Date[];
//   capacityMode: CapacityMode;
//   pricingType: PricingType;
//   isAdmin: boolean;
//   userId: string;
// }) {
//   let hasConflict = false;

//   for (const date of dates) {
//     const row = await tx.tourDailyCapacity.findFirst({
//       where: {
//         tourId,
//         scheduleId,
//         date,
//       },
//     });

//     if (!row) {
//       throw new Error('Capacity row not found');
//     }

//     if (capacityMode === 'EXCLUSIVE') {
//       const hasBooking = row.booked > 0;

//       if (hasBooking) {
//         hasConflict = true;

//         if (!isAdmin) {
//           throw new Error('Date already has an existing booking');
//         }
//       }

//       await logAdminWarning({
//         tx,
//         actionType: 'FORCED_PRIVATE',
//         message: 'Admin forced booking on exclusive date',
//         tourId: row.tourId,
//         actorId: userId,
//         metadata: {
//           date,
//           existingBooked: row.booked,
//         },
//       });
//     }

//     if (capacityMode === 'MIXED' && pricingType === 'PRIVATE') {
//       if (row.booked > 0) {
//         hasConflict = true;

//         if (!isAdmin) {
//           throw new Error(
//             'Cannot create private booking with existing joiners',
//           );
//         }

//         await logAdminWarning({
//           tx,
//           actionType: 'FORCED_PRIVATE',
//           message: 'Admin forced private booking over joiners',
//           tourId: row.tourId,
//           actorId: userId,
//           metadata: {
//             date,
//             existingBooked: row.booked,
//           },
//         });
//       }
//     }

//     if (capacityMode === 'MIXED' && pricingType === 'JOINER') {
//       const hasPrivateBooking = await tx.tourBooking.findFirst({
//         where: {
//           tourId: row.tourId,
//           scheduleId:
//             ctx.scheduleKey === 'NO_SCHEDULE' ? null : ctx.scheduleKey,
//           pricingType: 'PRIVATE',
//           startDate: {
//             lte: date,
//           },
//           endDate: {
//             gte: date,
//           },
//         },
//         select: {
//           id: true,
//         },
//       });

//       if (hasPrivateBooking) {
//         hasConflict = true;

//         if (!isAdmin) {
//           throw new Error('Cannot join because a private booking exist');
//         }

//         await logAdminWarning({
//           tx,
//           actionType: 'FORCED_PRIVATE',
//           message: 'Admin forced joiner booking over private booking',
//           tourId: row.tourId,
//           actorId: userId,
//           metadata: {
//             date,
//           },
//         });
//       }
//     }
//   }

//   return {
//     hasConflict,
//   };
// }
