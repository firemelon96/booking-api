"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userCreateBooking = userCreateBooking;
exports.adminCreateTourBooking = adminCreateTourBooking;
const tour_booking_validator_1 = require("./tour-booking-validator");
const tour_booking_service_1 = require("./tour-booking.service");
const tour_validator_1 = require("../tour.validator");
async function userCreateBooking(req, res, next) {
    if (!req.user) {
        throw new Error('Unauthorized');
    }
    const params = tour_validator_1.tourIdParams.safeParse(req.params);
    if (!params.success) {
        throw new Error('Invalid params');
    }
    const payload = tour_booking_validator_1.createTourBookingSchema.safeParse(req.body);
    if (!payload.success) {
        throw new Error('Invalid fields');
    }
    try {
        const booking = await (0, tour_booking_service_1.createTourBooking)(params.data.tourId, req.user.userId, req.user.role, payload.data);
        res.status(201).json(booking);
    }
    catch (error) {
        next(error);
    }
}
async function adminCreateTourBooking(req, res, next) {
    if (!req.user) {
        throw new Error('Unauthorized');
    }
    const { tourId, ...rest } = req.body;
    if (!tourId) {
        throw new Error('Tour id must be provided');
    }
    const payload = tour_booking_validator_1.createTourBookingSchema.safeParse(rest);
    if (!payload.success) {
        throw new Error('Invalid fields');
    }
    try {
        const booking = await (0, tour_booking_service_1.createTourBooking)(tourId, req.user.userId, req.user.role, payload.data);
        res.json(booking);
    }
    catch (error) {
        next(error);
    }
}
