"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAllBookings = listAllBookings;
exports.reschedBooking = reschedBooking;
exports.cancelBooking = cancelBooking;
exports.bookingDetail = bookingDetail;
exports.referenceBooking = referenceBooking;
const booking_validators_1 = require("./booking.validators");
const booking_service_1 = require("./booking.service");
async function listAllBookings(req, res, next) {
    if (!req.user) {
        throw new Error('Unauthorized');
    }
    const payload = booking_validators_1.bookingQuerySchema.safeParse(req.query);
    if (!payload.success) {
        throw new Error('Invalid fields');
    }
    try {
        const results = await (0, booking_service_1.getAllBookingsService)(req.user.userId, req.user.role, payload.data);
        res.json(results);
    }
    catch (error) {
        next(error);
    }
}
async function reschedBooking(req, res, next) {
    if (!req.user) {
        throw new Error('Unauthorized');
    }
    const params = booking_validators_1.bookingIdParams.safeParse(req.params);
    if (!params.success) {
        throw new Error('Invalid params');
    }
    const payload = booking_validators_1.reschedulBookingSchema.safeParse(req.body);
    if (!payload.success) {
        throw new Error('Invalid fields');
    }
    try {
        const booking = await (0, booking_service_1.rescheduleBooking)(params.data.bookingId, req.user.userId, req.user.role, payload.data);
        res.json(booking);
    }
    catch (error) {
        next(error);
    }
}
async function cancelBooking(req, res, next) {
    if (!req.user) {
        throw new Error('Unauthorized');
    }
    const input = {
        bookingId: req.params.bookingId,
        userId: req.user.userId,
        role: req.user.role,
    };
    const payload = booking_validators_1.bookingSchema.safeParse(input);
    if (!payload.success) {
        throw new Error('Invalid fields');
    }
    try {
        await (0, booking_service_1.cancelbooked)(payload.data);
        return res.json({ success: true, message: 'Cancelled successfully.' });
    }
    catch (error) {
        next(error);
    }
}
async function bookingDetail(req, res, next) {
    if (!req.user) {
        throw new Error('Unauthorized');
    }
    const input = {
        ...req.params,
        userId: req.user.userId,
        role: req.user.role,
    };
    const payload = booking_validators_1.bookingSchema.safeParse(input);
    if (!payload.success) {
        throw new Error('Invalid fields');
    }
    try {
        const booking = await (0, booking_service_1.detailedBooking)(payload.data);
        return res.json(booking);
    }
    catch (error) {
        next(error);
    }
}
async function referenceBooking(req, res, next) {
    const { reference } = req.body;
    if (!reference) {
        throw new Error('provide reference');
    }
    try {
        const bookingReference = await (0, booking_service_1.getBookingByReference)(reference);
        res.json(bookingReference);
    }
    catch (error) {
        next(error);
    }
}
