"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDaysDiff = getDaysDiff;
exports.isExpired = isExpired;
exports.normalizeInterval = normalizeInterval;
exports.overlaps = overlaps;
exports.getMonthRange = getMonthRange;
exports.getScheduleKey = getScheduleKey;
exports.isActiveBooking = isActiveBooking;
exports.sanitizeBooking = sanitizeBooking;
const date_fns_1 = require("date-fns");
function getDaysDiff(start, end) {
    if (!end)
        return 1;
    return (0, date_fns_1.differenceInCalendarDays)((0, date_fns_1.startOfDay)(end), (0, date_fns_1.startOfDay)(start)) + 1;
}
function isExpired(status, expiredAt) {
    return status === 'PENDING' && expiredAt && expiredAt < new Date();
}
function normalizeInterval(start, end) {
    const s = (0, date_fns_1.startOfDay)(start);
    const e = (0, date_fns_1.startOfDay)(end ?? start);
    return { start: s, end: e };
}
function overlaps(a, b) {
    return (0, date_fns_1.areIntervalsOverlapping)(a, b, { inclusive: true });
}
function getMonthRange(month) {
    const [year, m] = month.split('-').map(Number);
    const start = (0, date_fns_1.startOfMonth)(new Date(year, m - 1));
    const end = (0, date_fns_1.endOfMonth)(start);
    return { start, end };
}
function getScheduleKey(scheduleId) {
    return scheduleId ?? 'NO_SCHEDULE';
}
function isActiveBooking(b, now) {
    if (b.status === 'CONFIRMED')
        return true;
    if (b.status === 'PENDING' && b.expiresAt && b.expiresAt > now) {
        return true;
    }
    return false;
}
function sanitizeBooking(booking) {
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
