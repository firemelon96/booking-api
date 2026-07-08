import { prisma } from '../../../config/prisma';
import { Role } from '../../../generated/prisma/enums';

export async function findTransferBookingOrThrow({
  bookingId,
}: {
  bookingId: string;
}) {
  const transferBooking = await prisma.transferBooking.findUnique({
    where: { bookingId },
    include: { booking: true, schedule: true },
  });

  if (!transferBooking) {
    throw new Error('Transfer Booking Not found');
  }

  return transferBooking;
}
