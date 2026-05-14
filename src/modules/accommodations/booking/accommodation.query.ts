import { prisma } from '../../../config/prisma';
import { Role } from '../../../generated/prisma/enums';

export async function findAccommodationBookingOrThrow({
  bookingId,
  role,
  userId,
}: {
  bookingId: string;
  role: Role;
  userId: string;
}) {
  const accommodationBooking = await prisma.accommodationBooking.findUnique({
    where: {
      bookingId,
      ...(role === 'USER' ? { userId } : {}),
    },
    include: {
      accommodation: true,
      booking: true,
      unit: true,
    },
  });

  if (!accommodationBooking) {
    throw new Error('Accommodation booking does not exist');
  }

  return accommodationBooking;
}
