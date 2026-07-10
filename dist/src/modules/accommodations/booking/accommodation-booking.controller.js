"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminCreateAccommodationBooking = adminCreateAccommodationBooking;
exports.createBookingController = createBookingController;
const accommodation_booking_validator_1 = require("./accommodation-booking.validator");
const accommodation_booking_service_1 = require("./accommodation-booking.service");
const user_validation_1 = require("../../users/user.validation");
async function adminCreateAccommodationBooking(req, res, next) {
    if (!req.user) {
        throw new Error('Unauthorized');
    }
    const { accommodationId, ...rest } = req.body;
    if (!accommodationId) {
        throw new Error('Invalid accommodation provided');
    }
    const payload = accommodation_booking_validator_1.createAccommodationBookingSchema.safeParse(rest);
    if (!payload.success) {
        throw new Error('Invalid fields');
    }
    try {
        const createBooking = await (0, accommodation_booking_service_1.createAccommodationBookingService)(accommodationId, req.user.userId, req.user.role, payload.data);
        res.json(createBooking);
    }
    catch (error) {
        next(error);
    }
}
async function createBookingController(req, res, next) {
    if (!req.user) {
        throw new Error('Unauthorized');
    }
    const userId = user_validation_1.userIdSchema.safeParse(req.user);
    const accommodationId = accommodation_booking_validator_1.accommodationIdParams.safeParse(req.params);
    if (!accommodationId.success) {
        throw new Error('Invalid accommodation');
    }
    if (!userId.success) {
        throw new Error('Unauthorized userid');
    }
    const payload = accommodation_booking_validator_1.createAccommodationBookingSchema.safeParse(req.body);
    if (!payload.success) {
        throw new Error('Invalid fields');
    }
    try {
        const createBooking = await (0, accommodation_booking_service_1.createAccommodationBookingService)(accommodationId.data.accommodationId, userId.data.userId, req.user.role, payload.data);
        res.json(createBooking);
    }
    catch (error) {
        next(error);
    }
}
