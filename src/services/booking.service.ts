import { schedule, validate } from 'node-cron';
import { prisma } from '../config/prisma';
import {
  getDaysDiff,
  getExistingBookings,
  getTourOrThrow,
  normalizeInterval,
  validateAvailability,
} from '../utils/helper';
import { calculateTotalPrice } from './pricing.service';
import { get } from 'lodash';
import {
  COOLDOWN_HOURS,
  LOCK_HOURS,
  MAX_RESCHEDULES,
  MAX_SCHEDULE_DAYS,
} from '../constant/constant';
import { startOfDay } from 'date-fns';

export async function createBooking(params: {
  userId: string;
  tourId: string;
  pricingType: 'JOINER' | 'PRIVATE';
  participants: number;
  startDate: Date;
  endDate?: Date | null;
  scheduleId?: string | null;
  notes?: string | null;
}) {
  const { userId, tourId, pricingType, participants } = params;

  const tour = await getTourOrThrow(tourId);

  if (tour.types === 'DAY' && params.endDate) {
    throw new Error('Day tours cannot have an end date.');
  }

  if (tour.types === 'DAY' && !params.scheduleId) {
    throw new Error('Day tours require a schedule option to be selected.');
  }

  if (tour.types === 'PACKAGE' && !params.endDate) {
    throw new Error('Package tours require an end date.');
  }

  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Tour" WHERE id = ${tourId} FOR UPDATE`;

    const requestedInterval = normalizeInterval(
      params.startDate,
      params.endDate,
    );

    const existingBookings = await getExistingBookings(
      tx,
      tourId,
      requestedInterval,
    );

    if (params.scheduleId) {
      const schedule = await tx.tourScheduleOption.findFirst({
        where: {
          id: params.scheduleId,
          tourId,
        },
      });

      if (!schedule) {
        throw new Error('Invalid schedule selected');
      }
    }

    validateAvailability(
      pricingType,
      existingBookings,
      requestedInterval,
      tour.joinerCapacity,
      participants,
    );

    const pricing = await calculateTotalPrice({
      tx,
      tourId,
      pricingType,
      participants,
    });

    const booking = await tx.booking.create({
      data: {
        userId,
        tourId,
        pricingType,
        participants,
        totalPrice: pricing.totalPrice,
        startDate: requestedInterval.start,
        endDate: params.endDate ? requestedInterval.end : null,
        scheduleId: params.scheduleId || null,
        notes: params.notes || null,
      },
      include: {
        tour: {
          select: { id: true, joinerCapacity: true, name: true, slug: true },
        },
      },
    });

    await tx.bookingAuditLog.create({
      data: {
        bookingId: booking.id,
        actorId: userId,
        actorType: 'USER',
        action: 'CREATED',
        newValue: booking,
      },
    });

    return booking;
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

export async function cancelBooking(bookingId: string, userId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    throw new Error('Booking not found');
  }

  if (booking.userId !== userId) {
    throw new Error('Unauthorized to cancel this booking');
  }

  return prisma.booking.delete({
    where: { id: bookingId },
  });
}

export async function adminCancelBooking(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    throw new Error('Booking not found');
  }

  return prisma.booking.delete({
    where: { id: bookingId },
  });
}

export async function rescheduleExistingBooking(data: {
  bookingId: string;
  userId: string;
  newStartDate: Date;
  newEndDate?: Date | null;
  newScheduleId?: string | null;
  reason?: string | null;
}) {
  const requestedInterval = normalizeInterval(
    data.newStartDate,
    data.newEndDate,
  );

  const booking = await prisma.booking.findUnique({
    where: { id: data.bookingId },
    include: {
      tour: { select: { id: true, joinerCapacity: true } },
    },
  });

  if (!booking) {
    throw new Error('Booking not found');
  }

  const maxReschedulesReached = booking.rescheduleCount >= MAX_RESCHEDULES;

  if (maxReschedulesReached) {
    throw new Error(
      `Maximum reschedule limit of ${MAX_RESCHEDULES} reached for this booking.`,
    );
  }

  if (
    booking.startDate.getTime() === requestedInterval.start.getTime() &&
    (booking.endDate?.getTime() ?? null) ===
      (requestedInterval.end?.getTime() ?? null)
  ) {
    throw new Error('No changes detected');
  }

  if (booking.scheduleId && !data.newScheduleId) {
    throw new Error('Schedule option is required for this booking');
  }

  if (booking.userId !== data.userId) {
    throw new Error('Unauthorized to reschedule this booking');
  }

  if (booking.status !== 'CONFIRMED') {
    throw new Error('Only confirmed bookings can be rescheduled');
  }

  const originalDays = getDaysDiff(booking.startDate, booking.endDate);
  const newDays = getDaysDiff(data.newStartDate, data.newEndDate);

  if (originalDays === 1 && data.newEndDate) {
    throw new Error('Day bookings cannot have an end date.');
  }

  if (originalDays > 1 && !data.newEndDate) {
    throw new Error('Multi-day bookings require an end date.');
  }

  if (originalDays > 1 && data.newScheduleId) {
    throw new Error('Schedule options are only valid for day bookings.');
  }

  if (data.newScheduleId) {
    const schedule = await prisma.tourScheduleOption.findFirst({
      where: { tourId: booking.tourId, id: data.newScheduleId },
    });

    if (!schedule) {
      throw new Error('Invalid schedule option for this tour.');
    }
  }

  //allowed duration only
  if (newDays !== originalDays) {
    throw new Error(
      `Rescheduling must maintain the same ${originalDays} days duration as the original booking.`,
    );
  }

  const maxAllowableDate = new Date(booking.startDate);
  maxAllowableDate.setDate(maxAllowableDate.getDate() + MAX_SCHEDULE_DAYS);

  if (startOfDay(data.newStartDate) > startOfDay(maxAllowableDate)) {
    throw new Error(
      `Rescheduling can only be done within ${MAX_SCHEDULE_DAYS} days of the original date.`,
    );
  }

  if (booking.lastRescheduleDate) {
    const hoursSinceLastReschedule =
      (Date.now() - booking.lastRescheduleDate.getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastReschedule < COOLDOWN_HOURS) {
      throw new Error(
        `You must wait at least ${COOLDOWN_HOURS} hours between reschedules. Please try again later.`,
      );
    }
  }

  const hoursDiff =
    (booking.startDate.getTime() - Date.now()) / (1000 * 60 * 60);

  if (hoursDiff < LOCK_HOURS) {
    throw new Error(
      `Reschedule is not allowed within ${LOCK_HOURS} hours of the booking start time.`,
    );
  }

  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Tour" WHERE id = ${booking.tourId} FOR UPDATE`;

    const existingBookings = await getExistingBookings(
      tx,
      booking.tourId,
      requestedInterval,
      booking.id, // exclude current booking from conflict check
    );

    validateAvailability(
      booking.pricingType,
      existingBookings,
      requestedInterval,
      booking.tour.joinerCapacity ?? 0,
      booking.participants,
    );

    //we are not going to change the participants number and recalculate because its already paid when confirmed

    const updatedBooking = await tx.booking.update({
      where: { id: data.bookingId },
      data: {
        startDate: requestedInterval.start,
        endDate: data.newEndDate ? requestedInterval.end : null,
        rescheduleCount: booking.rescheduleCount + 1,
        lastRescheduleDate: new Date(),
        scheduleId: data.newScheduleId ?? booking.scheduleId,
      },
      include: {
        tour: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    await tx.bookingAuditLog.create({
      data: {
        bookingId: booking.id,
        actorId: data.userId,
        actorType: 'USER',
        action: 'RESCHEDULED',
        reason: data.reason ?? null,
        previousValue: {
          startDate: booking.startDate,
          endDate: booking.endDate,
          scheduleId: booking.scheduleId,
        },
        newValue: {
          startDate: updatedBooking.startDate,
          endDate: updatedBooking.endDate,
          scheduleId: updatedBooking.scheduleId,
        },
      },
    });

    return updatedBooking;
  });
}

// export async function adminRescheduleBooking(
//   bookingId: string,
//   newStartDate: Date,
//   newEndDate?: Date | null,
// ) {
//   const booking = await prisma.booking.findUnique({
//     where: { id: bookingId },
//   });

//   if (!booking) {
//     throw new Error('Booking not found');
//   }

//   const tour = await getTourOrThrow(booking.tourId);

//   const requestedInterval = normalizeInterval(newStartDate, newEndDate);

//   const existingBookings = await getExistingBookings(
//     booking.tourId,
//     requestedInterval,
//     booking.id, // exclude current booking from conflict check
//   );

//   validateAvailability(
//     booking.pricingType,
//     existingBookings,
//     requestedInterval,
//     tour.joinerCapacity,
//     booking.participants,
//   );

//   return prisma.booking.update({
//     where: { id: bookingId },
//     data: {
//       startDate: requestedInterval.start,
//       endDate: newEndDate ? requestedInterval.end : null,
//     },
//     include: {
//       tour: {
//         select: {
//           id: true,
//           name: true,
//           slug: true,
//           pricing: {
//             select: { price: true },
//           },
//         },
//       },
//     },
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
