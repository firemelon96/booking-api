import {
  differenceInCalendarDays,
  eachDayOfInterval,
  isSameDay,
} from 'date-fns';
import { Booking, TourBooking } from '../../generated/prisma/client';
import { normalizeInterval } from '../../utils/helper';

export const BOOKING_RULES = {
  MAX_RESCHEDULES: 2,
  CUTOFF_HOURS: 24,
};

export function validateBookingRules({
  scheduleId,
  participants,
  durationDays,
  schedules,
  interval,
}: {
  scheduleId: string | null;
  participants: number;
  durationDays?: number;
  schedules: { id: string }[];
  interval: { start: Date; end: Date };
}) {
  const isSingleDay = interval.start.getTime() === interval.end.getTime();

  if (interval.start.getTime() < new Date(Date.now()).getTime()) {
    throw new Error('Unable to book past date');
  }

  if (schedules.length === 0 && scheduleId) {
    throw new Error('This tour does not have schedules');
  }

  if (schedules.length > 0) {
    if (!isSingleDay) {
      throw new Error('Bookings for scheduled tours must be for a single day');
    }

    if (!scheduleId) {
      throw new Error('Schedule is required.');
    }

    if (!schedules.some((s) => s.id === scheduleId)) {
      throw new Error('Invalid schedule');
    }
  }

  const days = differenceInCalendarDays(interval.end, interval.start) + 1;

  if (durationDays && days !== durationDays) {
    throw new Error(
      `This tour requires a booking of exactly ${durationDays} days`,
    );
  }

  if (participants <= 0) {
    throw new Error('Invalid number of participants');
  }
}

export function validateRescheduleRules(
  tourBooking: TourBooking & { booking: Booking },
  newInterval: { start: Date; end: Date },
  scheduleId?: string | null,
) {
  if (tourBooking.booking.bookingStatus === 'CONFIRMED') {
    throw new Error('Cannot reschedule this booking');
  }

  const oldScheduleId = tourBooking.scheduleId ?? null;

  if (oldScheduleId && !scheduleId) {
    throw new Error('Schedule is required');
  }

  const oldInterval = normalizeInterval(
    tourBooking.startDate,
    tourBooking.endDate,
  );

  if (oldInterval === newInterval) {
    throw new Error('No changes detected');
  }

  const oldDates = eachDayOfInterval(oldInterval);
  const newDates = eachDayOfInterval(newInterval);

  const datesToReserve = newDates.filter(
    (d) => !oldDates.some((o) => isSameDay(o, d)),
  );

  const datesToRelease = oldDates.filter(
    (d) => !newDates.some((n) => isSameDay(n, d)),
  );

  const oldDaysCount = differenceInCalendarDays(
    oldInterval.start,
    oldInterval.end,
  );

  const newDaysCount = differenceInCalendarDays(
    newInterval.start,
    newInterval.end,
  );

  if (oldDaysCount !== newDaysCount) {
    throw new Error('Invalid duration length');
  }

  const cutoff = new Date(
    tourBooking.startDate.getTime() -
      BOOKING_RULES.CUTOFF_HOURS * 60 * 60 * 1000,
  );

  if (new Date() > cutoff) {
    throw new Error(
      `Rescheduling must be done at least ${BOOKING_RULES.CUTOFF_HOURS} hours before the start time`,
    );
  }

  if (tourBooking.booking.rescheduleCount > BOOKING_RULES.MAX_RESCHEDULES) {
    throw new Error(`Maximum reschedule reached.`);
  }

  return { datesToRelease, datesToReserve, oldScheduleId };
}

export function validateCancelRules({
  existingBooking,
  tourBooking,
}: {
  existingBooking: Booking;
  tourBooking: TourBooking;
}) {
  if (
    existingBooking.bookingStatus === 'CANCELLED' ||
    existingBooking.bookingStatus === 'EXPIRED'
  ) {
    return existingBooking;
  }

  if (tourBooking.startDate < new Date()) {
    throw new Error('Cannot cancel past bookings');
  }

  const cutoff = new Date(
    tourBooking.startDate.getTime() -
      BOOKING_RULES.CUTOFF_HOURS * 60 * 60 * 1000,
  );

  if (new Date() > cutoff) {
    throw new Error(
      `Cancellations must be made at least ${BOOKING_RULES.CUTOFF_HOURS} hours before the booking start time.`,
    );
  }
}
