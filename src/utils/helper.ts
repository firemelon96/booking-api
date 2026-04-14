import {
  areIntervalsOverlapping,
  differenceInCalendarDays,
  eachDayOfInterval,
  startOfDay,
} from 'date-fns';
import { prisma } from '../config/prisma';
import { BookingStatus, Prisma } from '../generated/prisma/client';

export function getDaysDiff(start: Date, end?: Date | null) {
  if (!end) return 1;

  return differenceInCalendarDays(startOfDay(end), startOfDay(start)) + 1;
}

export function isExpired(status: BookingStatus, expiredAt?: Date | null) {
  return status === 'PENDING' && expiredAt && expiredAt < new Date();
}

export function normalizeInterval(start: Date, end?: Date | null) {
  const s = startOfDay(start);
  const e = startOfDay(end ?? start);
  return { start: s, end: e };
}

export function overlaps(
  a: { start: Date; end: Date },
  b: { start: Date; end: Date },
) {
  return areIntervalsOverlapping(a, b, { inclusive: true });
}

export async function getTourOrThrow(tourId: string) {
  const tour = await prisma.tour.findUnique({
    where: { id: tourId },
    select: {
      id: true,
      joinerCapacity: true,
      pricing: true,
      capacityMode: true,
      schedules: true,
    },
  });

  if (!tour) throw new Error('Tour not found');
  return tour;
}

export function sanitizeBooking(booking: any) {
  return {
    id: booking.id,
    tourId: booking.tourId,
    pricingType: booking.pricingType,
    participants: booking.participants,
    startDate: booking.startDate,
    endDate: booking.endDate,
    scheduleId: booking.scheduleId,
    status: booking.status,
    totalPrice: booking.totalPrice,
  };
}
