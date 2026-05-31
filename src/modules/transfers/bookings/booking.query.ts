import { prisma } from '../../../config/prisma';
import { Role } from '../../../generated/prisma/enums';

export async function findTransferBookingOrThrow({
  bookingId,
  userId,
  role,
}: {
  bookingId: string;
  userId: string;
  role: Role;
}) {
  const transferBooking = await prisma.transferBooking.findUnique({
    where: { bookingId, ...(role === 'USER' ? { userId } : {}) },
    include: { booking: true, schedule: true },
  });

  if (!transferBooking) {
    throw new Error('Transfer Booking Not found');
  }

  return transferBooking;
}
