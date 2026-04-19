import { schedule, validate } from 'node-cron';
import { prisma } from '../config/prisma';
import {
  buildInterval,
  checkAvailability,
  getDaysDiff,
  getTourOrThrow,
  isExpired,
  normalizeInterval,
  reserveCapacity,
  sanitizeBooking,
} from '../utils/helper';
import { calculate, calculateTotalPrice } from './pricing.service';
import { get } from 'lodash';
import {
  BOOKING_RULES,
  COOLDOWN_HOURS,
  LOCK_HOURS,
  MAX_RESCHEDULES,
  MAX_SCHEDULE_DAYS,
} from '../constant/constant';
import { startOfDay } from 'date-fns';
import z from 'zod';
import {
  createBookingSchema,
  rescheduleBookingSchema,
} from '../validators/booking.schema';
import { decrement, ensureRows, getRows } from './capacity.service';
import { reserve } from './availability.service';
import { Prisma } from '../generated/prisma/client';

export async function listAllBookings() {
  return prisma.booking.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      tour: {
        select: {
          slug: true,
          pricing: {
            select: {
              price: true,
              minGroupSize: true,
              maxGroupSize: true,
              pricingType: true,
              isGroupPrice: true,
            },
          },
        },
      },
      user: {
        select: {
          name: true,
        },
      },
    },
  });
}

export async function listMyBookings(userId: string) {
  return prisma.booking.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      tour: {
        select: {
          id: true,
          name: true,
          slug: true,
          pricing: {
            select: { price: true },
          },
        },
      },
    },
  });
}

// export async function cancelBooking(params: {
//   bookingId: string;
//   userId: string;
// }) {
//   return prisma.$transaction(async (tx) => {
//     const booking = await tx.booking.findUnique({
//       where: { id: params.bookingId },
//       include: {
//         tour: {
//           include: { cancellationPolicy: true },
//         },
//       },
//     });

//     if (booking?.userId !== params.userId) {
//       throw new Error('Unauthorized');
//     }

//     if (booking.status !== 'CONFIRMED') {
//       throw new Error('Only confirmed booking can be cancel.');
//     }
//   });
// }

export async function getBookingById(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      tour: {
        select: { id: true, name: true, slug: true },
      },
      user: {
        select: { name: true, email: true },
      },
    },
  });

  if (!booking) {
    throw new Error('Booking not found');
  }

  return booking;
}

// export async function createBooking(params: {
//   userId: string;
//   tourId: string;
//   pricingType: 'JOINER' | 'PRIVATE';
//   participants: number;
//   startDate: Date;
//   endDate?: Date | null;
//   scheduleId?: string | null;
//   notes?: string | null;
// }) {
//   const {
//     userId,
//     tourId,
//     pricingType,
//     participants,
//     scheduleId,
//     notes,
//     startDate,
//     endDate,
//   } = params;

//   const requestInterval = normalizeInterval(startDate, endDate);

//   const tour = await getTourOrThrow(tourId);

//   if (tour.types === 'DAY') {
//     if (params.endDate) {
//       throw new Error('Day tour does not require an end date.');
//     }

//     if (!scheduleId) {
//       throw new Error('Schedule is required for this tour.');
//     }

//     const schedule = await prisma.tourScheduleOption.findFirst({
//       where: {
//         id: scheduleId,
//         tourId,
//       },
//     });

//     if (!schedule) {
//       throw new Error('Invalid schedule selected');
//     }
//   }

//   if (tour.types === 'PACKAGE') {
//     if (scheduleId) {
//       throw new Error('Package tour does not require schedule');
//     }

//     if (!params.endDate) {
//       throw new Error('Package tours require an end date.');
//     }

//     if (requestInterval.start.getTime() === requestInterval.end.getTime()) {
//       throw new Error('Start and end date cannot be the same.');
//     }
//   }

//   return prisma.$transaction(async (tx) => {
//     await tx.$queryRaw`SELECT * FROM "TourDailyCapacity"
//     WHERE "tourId" = ${tourId}
//     AND date BETWEEN ${requestInterval.start} AND ${requestInterval.end}
//     FOR UPDATE`;

//     await checkAvailability({
//       tx,
//       tourId,
//       tourType: tour.types,
//       pricingType,
//       participants,
//       requestInterval,
//       scheduleId,
//     });

//     if (pricingType === 'JOINER') {
//       await reserveCapacity({
//         tx,
//         tourId,
//         requestInterval,
//         participants,
//         capacity: tour.joinerCapacity,
//         scheduleId,
//       });
//     }

//     const pricing = await calculateTotalPrice({
//       tx,
//       tourId,
//       pricingType,
//       participants,
//     });

//     const booking = await tx.booking.create({
//       data: {
//         userId,
//         tourId,
//         pricingType,
//         participants,
//         totalPrice: pricing.totalPrice,
//         startDate: requestInterval.start,
//         endDate: requestInterval.end ?? null,
//         scheduleId: params.scheduleId || null,
//         notes: params.notes || null,
//       },
//       include: {
//         tour: {
//           select: { id: true, joinerCapacity: true, name: true, slug: true },
//         },
//       },
//     });

//     await tx.bookingAuditLog.create({
//       data: {
//         bookingId: booking.id,
//         actorId: userId,
//         actorType: 'USER',
//         action: 'CREATED',
//         newValue: booking,
//       },
//     });

//     return booking;
//   });
// }

// export async function rescheduleExistingBooking(data: {
//   bookingId: string;
//   userId: string;
//   newStartDate: Date;
//   newEndDate?: Date | null;
//   newScheduleId?: string | null;
//   reason?: string | null;
// }) {
//   const requestInterval = normalizeInterval(data.newStartDate, data.newEndDate);

//   const booking = await prisma.booking.findUnique({
//     where: { id: data.bookingId },
//     include: {
//       tour: { select: { id: true, joinerCapacity: true } },
//     },
//   });

//   if (!booking) {
//     throw new Error('Booking not found');
//   }

//   const maxReschedulesReached = booking.rescheduleCount >= MAX_RESCHEDULES;

//   if (maxReschedulesReached) {
//     throw new Error(
//       `Maximum reschedule limit of ${MAX_RESCHEDULES} reached for this booking.`,
//     );
//   }

//   if (
//     booking.startDate.getTime() === requestInterval.start.getTime() &&
//     (booking.endDate?.getTime() ?? null) ===
//       (requestInterval.end?.getTime() ?? null)
//   ) {
//     throw new Error('No changes detected');
//   }

//   if (booking.scheduleId && !data.newScheduleId) {
//     throw new Error('Schedule option is required for this booking');
//   }

//   if (booking.userId !== data.userId) {
//     throw new Error('Unauthorized to reschedule this booking');
//   }

//   if (booking.status !== 'CONFIRMED') {
//     throw new Error('Only confirmed bookings can be rescheduled');
//   }

//   const originalDays = getDaysDiff(booking.startDate, booking.endDate);
//   const newDays = getDaysDiff(data.newStartDate, data.newEndDate);

//   if (originalDays === 1 && data.newEndDate) {
//     throw new Error('Day bookings cannot have an end date.');
//   }

//   if (originalDays > 1 && !data.newEndDate) {
//     throw new Error('Multi-day bookings require an end date.');
//   }

//   if (originalDays > 1 && data.newScheduleId) {
//     throw new Error('Schedule options are only valid for day bookings.');
//   }

//   if (data.newScheduleId) {
//     const schedule = await prisma.tourScheduleOption.findFirst({
//       where: { tourId: booking.tourId, id: data.newScheduleId },
//     });

//     if (!schedule) {
//       throw new Error('Invalid schedule option for this tour.');
//     }
//   }

//   //allowed duration only
//   if (newDays !== originalDays) {
//     throw new Error(
//       `Rescheduling must maintain the same ${originalDays} days duration as the original booking.`,
//     );
//   }

//   const maxAllowableDate = new Date(booking.startDate);
//   maxAllowableDate.setDate(maxAllowableDate.getDate() + MAX_SCHEDULE_DAYS);

//   if (startOfDay(data.newStartDate) > startOfDay(maxAllowableDate)) {
//     throw new Error(
//       `Rescheduling can only be done within ${MAX_SCHEDULE_DAYS} days of the original date.`,
//     );
//   }

//   if (booking.lastRescheduleDate) {
//     const hoursSinceLastReschedule =
//       (Date.now() - booking.lastRescheduleDate.getTime()) / (1000 * 60 * 60);
//     if (hoursSinceLastReschedule < COOLDOWN_HOURS) {
//       throw new Error(
//         `You must wait at least ${COOLDOWN_HOURS} hours between reschedules. Please try again later.`,
//       );
//     }
//   }

//   const hoursDiff =
//     (booking.startDate.getTime() - Date.now()) / (1000 * 60 * 60);

//   if (hoursDiff < LOCK_HOURS) {
//     throw new Error(
//       `Reschedule is not allowed within ${LOCK_HOURS} hours of the booking start time.`,
//     );
//   }

//   return prisma.$transaction(async (tx) => {
//     await tx.$queryRaw`SELECT id FROM "Tour" WHERE id = ${booking.tourId} FOR UPDATE`;

//     await checkAvailability({
//       tx,
//       tourId: booking.tourId,
//       pricingType: booking.pricingType,
//       participants: booking.participants,
//       requestInterval,
//       excludeBookingId: booking.id,
//     });

//     //we are not going to change the participants number and recalculate because its already paid when confirmed

//     const updatedBooking = await tx.booking.update({
//       where: { id: data.bookingId },
//       data: {
//         startDate: requestInterval.start,
//         endDate: data.newEndDate ? requestInterval.end : null,
//         rescheduleCount: booking.rescheduleCount + 1,
//         lastRescheduleDate: new Date(),
//         scheduleId: data.newScheduleId ?? booking.scheduleId,
//       },
//       include: {
//         tour: {
//           select: { id: true, name: true, slug: true },
//         },
//       },
//     });

//     await tx.bookingAuditLog.create({
//       data: {
//         bookingId: booking.id,
//         actorId: data.userId,
//         actorType: 'USER',
//         action: 'RESCHEDULED',
//         reason: data.reason ?? null,
//         previousValue: {
//           startDate: booking.startDate,
//           endDate: booking.endDate,
//           scheduleId: booking.scheduleId,
//         },
//         newValue: {
//           startDate: updatedBooking.startDate,
//           endDate: updatedBooking.endDate,
//           scheduleId: updatedBooking.scheduleId,
//         },
//       },
//     });

//     return updatedBooking;
//   });
// }

//NEW LOGIC

export async function createNewBooking({
  participants,
  pricingType,
  startDate,
  endDate,
  notes,
  scheduleId,
  tourId,
  userId,
}: z.infer<typeof createBookingSchema> & { userId: string }) {
  const interval = normalizeInterval(startDate, endDate);

  const tour = await getTourOrThrow(tourId);

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); //15 minutes

  //schedule is provided but does not have schedules link to tour
  if (tour.schedules.length === 0) {
    if (scheduleId) {
      throw new Error('Tour does not require schedule.');
    }

    if (interval.end.getTime() === interval.start.getTime()) {
      throw new Error('Cannot be the same date for multi days');
    }
  }

  //schedule is link with tour, if no schedule selected and does not exist in the tour schedule. guard
  if (tour.schedules.length > 0) {
    if (interval.end.getTime() !== interval.start.getTime()) {
      throw new Error('Cannot have multiple days.');
    }

    if (!scheduleId) {
      throw new Error('Schedule must be selected');
    }

    if (
      !tour.schedules.some((s) => s.id === scheduleId || s.id === 'NO_SCHEDULE')
    ) {
      throw new Error('Invalid schedule selected');
    }
  }

  const scheduleKey = scheduleId ?? 'NO_SCHEDULE';

  return prisma.$transaction(async (tx) => {
    const needsCapacity =
      tour.capacityMode === 'SHARED' ||
      (tour.capacityMode === 'MIXED' && pricingType === 'JOINER');

    if (needsCapacity) {
      await ensureRows({
        tx,
        tourId,
        interval,
        scheduleId,
        scheduleKey,
        capacity: tour.joinerCapacity ?? 0,
      });
    }

    await reserve({
      tx,
      tourId,
      interval,
      participants,
      scheduleId,
      scheduleKey,
      capacityMode: tour.capacityMode,
      pricingType,
    });

    const pricing = await calculate({ tx, participants, pricingType, tourId });

    const createBooking = await tx.booking.create({
      data: {
        tourId,
        userId,
        participants,
        pricingType,
        scheduleId: scheduleId ?? null,
        totalPrice: pricing.totalPrice,
        startDate: interval.start,
        endDate: interval.end ?? null,
        notes: notes ?? null,
        expiresAt,
      },
    });

    await tx.bookingAuditLog.create({
      data: {
        action: 'CREATED',
        actorId: userId,
        actorType: 'USER',
        newValue: createBooking,
        timestamp: new Date(),
        bookingId: createBooking.id,
      },
    });

    return createBooking;
  });
}

export async function rescheduleBooking({
  bookingId,
  newStartDate,
  userId,
  newEndDate,
  reason,
  scheduleId,
}: z.infer<typeof rescheduleBookingSchema> & {
  userId: string;
  bookingId: string;
}) {
  const booking = await prisma.booking.findUniqueOrThrow({
    where: { id: bookingId },
  });

  const tour = await getTourOrThrow(booking.tourId);

  const oldInterval = {
    start: booking.startDate,
    end: booking.endDate ?? booking.startDate,
  };

  const newInterval = normalizeInterval(newStartDate, newEndDate);

  if (oldInterval === newInterval) {
    throw new Error('No changes detected');
  }

  const oldSnapshot = sanitizeBooking(booking);

  const scheduleKey = scheduleId ?? 'NO_SCHEDULE';

  if (booking.scheduleId) {
    if (!scheduleId) {
      throw new Error('Provide new schedule');
    }

    if (!tour.schedules.some((s) => s.id === scheduleId)) {
      throw new Error('Invalid schedule selected');
    }
  }

  if (booking.status === 'PENDING') {
    throw new Error('Cannot reschedule pending booking');
  }

  if (booking.status === 'EXPIRED') {
    return booking;
  }

  const cutoff = new Date(
    booking.startDate.getTime() -
      BOOKING_RULES.RESCHEDULE_CUTOFF_HOURS * 60 * 60 * 1000,
  );

  if (new Date() > cutoff) {
    throw new Error(
      `Rescheduling must be done at least ${BOOKING_RULES.RESCHEDULE_CUTOFF_HOURS} hours before the booking start time.`,
    );
  }

  if (booking.rescheduleCount >= BOOKING_RULES.MAX_RESCHEDULES) {
    throw new Error(
      `Maximum reschedule limit of ${BOOKING_RULES.MAX_RESCHEDULES} reached for this booking.`,
    );
  }

  return prisma.$transaction(async (tx) => {
    const needsCapacity =
      tour.capacityMode === 'SHARED' ||
      (tour.capacityMode === 'MIXED' && booking.pricingType === 'JOINER');

    if (needsCapacity) {
      ensureRows({
        tx,
        tourId: tour.id,
        interval: newInterval,
        scheduleId,
        scheduleKey,
        capacity: tour.joinerCapacity ?? 0,
      });
    }

    //reserve New first
    await reserve({
      tx,
      tourId: tour.id,
      pricingType: booking.pricingType,
      capacityMode: tour.capacityMode,
      interval: newInterval,
      participants: booking.participants,
      scheduleId,
      scheduleKey,
      excludeBookingId: booking.id,
    });

    // release OLD ONLY if it used capacity
    const usedCapacity =
      tour.capacityMode === 'SHARED' ||
      (tour.capacityMode === 'MIXED' && booking.pricingType === 'JOINER');

    if (usedCapacity) {
      const oldRows = await getRows({
        tx,
        tourId: tour.id,
        interval: oldInterval,
        scheduleKey,
      });

      await decrement({
        tx,
        rows: oldRows,
        participants: booking.participants,
      });
    }

    const updatedBooking = await tx.booking.update({
      where: { id: booking.id },
      data: {
        startDate: newInterval.start,
        endDate: newInterval.end,
        scheduleId: scheduleId ?? null,
        rescheduleCount: { increment: 1 },
        lastRescheduleDate: new Date(),
      },
    });

    await tx.bookingAuditLog.create({
      data: {
        bookingId: booking.id,
        actorId: userId,
        actorType: 'USER',
        action: 'RESCHEDULED',
        previousValue: oldSnapshot,
        newValue: sanitizeBooking(updatedBooking),
        reason: reason ?? null,
      },
    });

    return updatedBooking;
  });
}

export async function cancelBooking({
  bookingId,
  userId,
}: {
  bookingId: string;
  userId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUniqueOrThrow({
      where: { id: bookingId },
    });

    const tour = await getTourOrThrow(booking.tourId);

    const scheduleKey = booking.scheduleId ?? 'NO_SCHEDULE';
    //protection
    if (booking.status === 'CANCELLED' || booking.status === 'EXPIRED') {
      return booking; // idempotent
    }

    if (booking.startDate < new Date()) {
      throw new Error('Cannot cancel past bookings');
    }

    const cutoff = new Date(
      booking.startDate.getTime() -
        BOOKING_RULES.RESCHEDULE_CUTOFF_HOURS * 60 * 60 * 1000,
    );

    if (new Date() > cutoff) {
      throw new Error(
        `Cancellations must be made at least ${BOOKING_RULES.RESCHEDULE_CUTOFF_HOURS} hours before the booking start time.`,
      );
    }

    const oldSnapshot = sanitizeBooking(booking);

    const interval = {
      start: booking.startDate,
      end: booking.endDate ?? booking.startDate,
    };

    if (
      tour.capacityMode === 'SHARED' ||
      (tour.capacityMode === 'MIXED' && booking.pricingType === 'JOINER')
    ) {
      const rows = await getRows({
        tx,
        tourId: tour.id,
        interval,
        scheduleKey,
      });

      await decrement({
        tx,
        rows,
        participants: booking.participants,
      });
    }

    const cancelledBooking = await tx.booking.update({
      where: { id: booking.id },
      data: { status: 'CANCELLED', canceledAt: new Date() },
    });

    await tx.bookingAuditLog.create({
      data: {
        bookingId: booking.id,
        actorId: userId,
        actorType: 'USER',
        action: 'CANCELLED',
        previousValue: oldSnapshot,
        newValue: sanitizeBooking(cancelledBooking),
      },
    });

    return cancelledBooking;
  });
}

export async function expireBooking({
  tx,
  bookingId,
}: {
  tx: Prisma.TransactionClient;
  bookingId: string;
}) {
  const booking = await tx.booking.findUniqueOrThrow({
    where: { id: bookingId },
  });

  const scheduleKey = booking.scheduleId ?? 'NO_SCHEDULE';

  //idempotent
  if (booking.status !== 'PENDING') return booking;

  if (!isExpired(booking.status, booking.expiresAt)) return booking;

  const tour = await getTourOrThrow(booking.tourId);

  const oldSnapshot = sanitizeBooking(booking);

  const interval = {
    start: booking.startDate,
    end: booking.endDate ?? booking.startDate,
  };

  //release capacity ONLY if used
  if (
    tour.capacityMode === 'SHARED' ||
    (tour.capacityMode === 'MIXED' && booking.pricingType === 'JOINER')
  ) {
    const rows = await getRows({
      tx,
      tourId: tour.id,
      interval,
      scheduleKey,
    });

    await decrement({ tx, rows, participants: booking.participants });
  }

  const updated = await tx.booking.update({
    where: { id: booking.id },
    data: {
      status: 'EXPIRED',
    },
  });

  await tx.bookingAuditLog.create({
    data: {
      bookingId: booking.id,
      action: 'CANCELLED', //TODO add EXPIRED enum
      actorId: 'SYSTEM',
      actorType: 'ADMIN', //TODO add SYSTEM to actor type enum
      previousValue: oldSnapshot,
      newValue: sanitizeBooking(updated),
    },
  });

  return updated;
}
