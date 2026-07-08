import { prisma } from '../../../config/prisma';

export async function findRentalItemBookingOrThrow(bookingId: string) {
  const rentalItemBooking = await prisma.rentalBooking.findUnique({
    where: {
      bookingId,
    },
    include: { booking: true, item: true },
  });

  if (!rentalItemBooking) {
    throw new Error('Rental booking not found');
  }

  return rentalItemBooking;
}
