import { prisma } from '../config/prisma';
import { expireBooking } from '../services/booking.service';
import cron from 'node-cron';

export async function expirePendingBooking() {
  cron.schedule('* * * * *', async () => {
    console.log('Running expired booking cleanup...');

    const expiredBookings = await prisma.booking.findMany({
      where: {
        status: 'PENDING',
        expiresAt: { lte: new Date() },
      },
      select: { id: true },
    });

    for (const booking of expiredBookings) {
      await prisma.$transaction(async (tx) => {
        expireBooking({ tx, bookingId: booking.id });
      });
    }
  });
}
