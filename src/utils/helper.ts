import {
  areIntervalsOverlapping,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  startOfDay,
  startOfMonth,
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

export function getMonthRange(month: string) {
  const [year, m] = month.split('-').map(Number);

  const start = startOfMonth(new Date(year, m - 1));
  const end = endOfMonth(start);

  return { start, end };
}

export function getScheduleKey(scheduleId?: string | null) {
  return scheduleId ?? 'NO_SCHEDULE';
}

export function isActiveBooking(
  b: { status: BookingStatus; expiresAt: Date | null },
  now: Date,
) {
  if (b.status === 'CONFIRMED') return true;

  if (b.status === 'PENDING' && b.expiresAt && b.expiresAt > now) {
    return true;
  }

  return false;
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
