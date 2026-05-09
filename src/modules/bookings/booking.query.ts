import { prisma } from '../../config/prisma';
import { Prisma, Role } from '../../generated/prisma/client';

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
