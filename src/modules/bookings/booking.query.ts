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
  if (role === 'ADMIN') {
    return prisma.booking.findUniqueOrThrow({
      where: {
        id: bookingId,
      },
    });
  }

  return prisma.booking.findFirstOrThrow({
    where: {
      id: bookingId,
      userId,
    },
  });
}
