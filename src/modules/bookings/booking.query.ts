import { prisma } from '../../config/prisma';
import { CancellationPolicy, Role } from '../../generated/prisma/client';

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
  let booking;

  if (role === 'ADMIN') {
    booking = await prisma.booking.findUnique({
      where: {
        id: bookingId,
      },
    });
  }

  booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      userId,
    },
  });

  if (!booking) {
    throw new Error('Booking Not found');
  }

  return booking;
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
