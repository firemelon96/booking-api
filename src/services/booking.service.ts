import { validate } from 'node-cron';
import { prisma } from '../config/prisma';
import {
  getExistingBookings,
  getTourOrThrow,
  normalizeInterval,
  overlaps,
  validateAvailability,
} from '../utils/helper';
import { calculateTotalPrice } from './pricing.service';
import { eachDayOfInterval } from 'date-fns';

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

  const requestedInterval = normalizeInterval(params.startDate, params.endDate);

  const existingBookings = await getExistingBookings(tourId, requestedInterval);

  validateAvailability(
    pricingType,
    existingBookings,
    requestedInterval,
    tour.joinerCapacity,
    participants,
  );

  // if (pricingType === 'PRIVATE') {
  //   const conflict = existingBookings.find((b) =>
  //     overlaps(b.interval, requestedInterval),
  //   );
  //   if (conflict) {
  //     throw new Error(
  //       'Date not available: private booking requires exclusive availability.',
  //     );
  //   }
  // }

  // if (pricingType === 'JOINER') {
  //   const days = eachDayOfInterval(requestedInterval);

  //   for (const day of days) {
  //     const dayInterval = normalizeInterval(day, day);

  //     const privateConflict = existingBookings.find(
  //       (b) => b.pricingType === 'PRIVATE' && overlaps(b.interval, dayInterval),
  //     );

  //     if (privateConflict) {
  //       throw new Error(
  //         'Date not available: private booking exists on the selected date.',
  //       );
  //     }

  //     const used = existingBookings.reduce((sum, b) => {
  //       if (b.pricingType !== 'JOINER') return sum;
  //       return overlaps(b.interval, dayInterval) ? sum + b.participants : sum;
  //     }, 0);

  //     if (used + participants > tour.joinerCapacity) {
  //       const dayStr = day.toISOString().slice(0, 10);
  //       throw new Error(
  //         `Capacity exceeded for ${dayStr}: ${used}/${tour.joinerCapacity} already booked.`,
  //       );
  //     }
  //   }
  // }

  const pricing = await calculateTotalPrice({
    tourId,
    pricingType,
    participants,
  });

  const booking = await prisma.booking.create({
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

  return booking;
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

// export async function rescheduleBooking(
//   bookingId: string,
//   userId: string,
//   newStartDate: Date,
//   newEndDate?: Date | null,
// ) {
//   const booking = await prisma.booking.findUnique({
//     where: { id: bookingId },
//   });

//   if (!booking) {
//     throw new Error('Booking not found');
//   }

//   if (booking.userId !== userId) {
//     throw new Error('Unauthorized to reschedule this booking');
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
//   });
// }
