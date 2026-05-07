import { prisma } from '../config/prisma';
import { BookingCreateInput } from '../modules/bookings/booking.type';

export async function createBooking({
  participants,
  pricingType,
  startDate,
  tourId,
  userId,
  scheduleId,
}: BookingCreateInput) {
  return prisma.booking.create({
    data: {
      status: 'CONFIRMED',
      startDate,
      participants,
      pricingType,
      tourId,
      scheduleId,
      userId,
    },
  });
}
