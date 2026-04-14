import { prisma } from '../config/prisma';
import { expireBooking } from '../services/booking.service';

export async function expirePendingBooking() {
  const expiredBooking = await prisma.booking.findMany({
    where: {
      status: 'PENDING',
      expiresAt: { lte: new Date() },
    },
    select: { id: true },
  });

  for (const booking of expiredBooking) {
    await prisma.$transaction(async (tx) => {
      expireBooking({ tx, bookingId: booking.id });
    });
  }
}
