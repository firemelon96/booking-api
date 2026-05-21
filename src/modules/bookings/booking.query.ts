import z from 'zod';
import { prisma } from '../../config/prisma';
import {
  CancellationPolicy,
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
  role?: Role;
  userId?: string;
}) {
  const booking = await prisma.booking.findUnique({
    where: {
      id: bookingId,
      ...(role === 'USER' ? { userId } : {}),
    },
    include: {
      tourBooking: {
        select: { tour: true },
      },
      accommodationBooking: {
        select: {
          accommodation: true,
          unit: true,
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
  tourStartDate,
  totalPrice,
  policy,
}: {
  bookingDate: Date;
  tourStartDate: Date;
  totalPrice: number;
  policy: CancellationPolicy;
}) {
  const now = bookingDate;

  const diffMs = tourStartDate.getTime() - now.getTime();

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
