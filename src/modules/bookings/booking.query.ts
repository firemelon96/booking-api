import z from 'zod';
import { prisma } from '../../config/prisma';
import {
  CancellationPolicy,
  CancellationRefundType,
  PaymentStatus,
  Prisma,
  Role,
} from '../../generated/prisma/client';
import { generateBookingReference } from './booking.reference';

export function detectOverbooking({
  capacity,
  booked,
  participants,
}: {
  capacity: number;
  booked: number;
  participants: number;
}) {
  return booked + participants > capacity;
}

export async function findBookingOrThrow({
  bookingId,
  role,
  userId,
}: {
  bookingId: string;
  role: Role;
  userId: string;
}) {
  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      ...(role === 'USER' ? { userId } : {}),
    },
    include: {
      tourBooking: {
        select: {
          tour: true,
          startDate: true,
          endDate: true,
          notes: true,
          participants: true,
          pricingType: true,
          schedule: true,
        },
      },
      accommodationBooking: {
        select: {
          accommodation: {
            select: { hasUnits: true, name: true },
          },
          unit: true,
          checkIn: true,
          checkOut: true,
          guests: true,
          nights: true,
          specialRequests: true,
        },
      },
      transferBooking: {
        select: {
          transfer: true,
          date: true,
          passengers: true,
          pickupLocation: true,
          dropoffLocation: true,
          pricingType: true,
          schedule: true,
        },
      },
      rentalBooking: {
        select: {
          item: true,
          startDate: true,
          endDate: true,
          pickupLocation: true,
          returnLocation: true,
          notes: true,
          quantity: true,
        },
      },
    },
  });

  if (!booking) {
    throw new Error('Booking Not found');
  }

  return booking;
}

export async function findTourBookingOrThrow({
  bookingId,
  userId,
  role,
}: {
  bookingId: string;
  userId: string;
  role: Role;
}) {
  const tourBooking = await prisma.tourBooking.findUnique({
    where: { bookingId, ...(role === 'USER' ? { userId } : {}) },
    include: { booking: true, tour: true },
  });

  if (!tourBooking) {
    throw new Error('Cannot find tour');
  }

  return tourBooking;
}

export function calculateCancellationRefund({
  bookingDate,
  startDate,
  totalPrice,
  policy,
}: {
  bookingDate: Date;
  startDate: Date;
  totalPrice: number;
  policy: any;
}): {
  refundType: CancellationRefundType;
  refundAmount: number;
  refundPercentage: number;
} {
  const now = bookingDate;

  const diffMs = startDate.getTime() - now.getTime();

  const hoursBeforeTour = diffMs / (1000 * 60 * 60);

  if (hoursBeforeTour >= policy.fullRefundHours) {
    return {
      refundType: 'FULL',
      refundAmount: totalPrice,
      refundPercentage: 100,
    };
  }

  if (hoursBeforeTour >= policy.partialRefundHours) {
    const amount = totalPrice * (policy.partialRefundPercentage / 100);

    return {
      refundType: 'PARTIAL',
      refundAmount: amount,
      refundPercentage: policy.partialRefundPercentage,
    };
  }

  return {
    refundType: 'NONE',
    refundAmount: 0,
    refundPercentage: 0,
  };
}

export async function createUniqueBookingReference(
  tx: Prisma.TransactionClient,
) {
  while (true) {
    const reference = generateBookingReference();

    const existing = await tx.booking.findUnique({
      where: {
        reference,
      },
    });

    if (!existing) {
      return reference;
    }
  }
}
