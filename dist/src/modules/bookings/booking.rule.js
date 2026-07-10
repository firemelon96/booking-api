"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BOOKING_RULES = void 0;
exports.validateBookingRules = validateBookingRules;
exports.validateRescheduleRules = validateRescheduleRules;
exports.validateCancelRules = validateCancelRules;
const date_fns_1 = require("date-fns");
const helper_1 = require("../../utils/helper");
exports.BOOKING_RULES = {
    MAX_RESCHEDULES: 2,
    CUTOFF_HOURS: 24,
};
function validateBookingRules({ scheduleId, participants, durationDays, schedules, interval, }) {
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
    const days = (0, date_fns_1.differenceInCalendarDays)(interval.end, interval.start) + 1;
    if (durationDays && days !== durationDays) {
        throw new Error(`This tour requires a booking of exactly ${durationDays} days`);
    }
    if (participants <= 0) {
        throw new Error('Invalid number of participants');
    }
}
function validateRescheduleRules(tourBooking, newInterval, scheduleId) {
    if (tourBooking.booking.bookingStatus === 'CONFIRMED') {
        throw new Error('Cannot reschedule this booking');
    }
    const oldScheduleId = tourBooking.scheduleId ?? null;
    if (oldScheduleId && !scheduleId) {
        throw new Error('Schedule is required');
    }
    const oldInterval = (0, helper_1.normalizeInterval)(tourBooking.startDate, tourBooking.endDate);
    if (oldInterval === newInterval) {
        throw new Error('No changes detected');
    }
    const oldDates = (0, date_fns_1.eachDayOfInterval)(oldInterval);
    const newDates = (0, date_fns_1.eachDayOfInterval)(newInterval);
    const datesToReserve = newDates.filter((d) => !oldDates.some((o) => (0, date_fns_1.isSameDay)(o, d)));
    const datesToRelease = oldDates.filter((d) => !newDates.some((n) => (0, date_fns_1.isSameDay)(n, d)));
    const oldDaysCount = (0, date_fns_1.differenceInCalendarDays)(oldInterval.start, oldInterval.end);
    const newDaysCount = (0, date_fns_1.differenceInCalendarDays)(newInterval.start, newInterval.end);
    if (oldDaysCount !== newDaysCount) {
        throw new Error('Invalid duration length');
    }
    const cutoff = new Date(tourBooking.startDate.getTime() -
        exports.BOOKING_RULES.CUTOFF_HOURS * 60 * 60 * 1000);
    if (new Date() > cutoff) {
        throw new Error(`Rescheduling must be done at least ${exports.BOOKING_RULES.CUTOFF_HOURS} hours before the start time`);
    }
    if (tourBooking.booking.rescheduleCount > exports.BOOKING_RULES.MAX_RESCHEDULES) {
        throw new Error(`Maximum reschedule reached.`);
    }
    return { datesToRelease, datesToReserve, oldScheduleId };
}
function validateCancelRules({ existingBooking, tourBooking, }) {
    if (existingBooking.bookingStatus === 'CANCELLED' ||
        existingBooking.bookingStatus === 'EXPIRED') {
        return existingBooking;
    }
    if (tourBooking.startDate < new Date()) {
        throw new Error('Cannot cancel past bookings');
    }
    const cutoff = new Date(tourBooking.startDate.getTime() -
        exports.BOOKING_RULES.CUTOFF_HOURS * 60 * 60 * 1000);
    if (new Date() > cutoff) {
        throw new Error(`Cancellations must be made at least ${exports.BOOKING_RULES.CUTOFF_HOURS} hours before the booking start time.`);
    }
}
