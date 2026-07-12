"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminCreateRentalBookingController = adminCreateRentalBookingController;
exports.createRentalBookingController = createRentalBookingController;
const rental_item_validator_1 = require("../items/rental-item.validator");
const rental_booking_validator_1 = require("./rental-booking.validator");
const rental_booking_service_1 = require("./rental-booking.service");
async function adminCreateRentalBookingController(req, res, next) {
    if (!req.user) {
        throw new Error('Unauthorized');
    }
    const { rentalId, itemId, ...rentalData } = req.body;
    const params = rental_item_validator_1.rentalItemIdParamsSchema.safeParse({ rentalId, itemId });
    if (!params.success) {
        throw new Error('Rental or item id not found');
    }
    const payload = rental_booking_validator_1.createRentalBookingSchema.safeParse(rentalData);
    if (!payload.success) {
        throw new Error('Invalid fields');
    }
    try {
        const createdBooking = await (0, rental_booking_service_1.createRentalBookingService)(req.user.userId, req.user.role, params.data, payload.data);
        res.json(createdBooking);
    }
    catch (error) {
        next(error);
    }
}
async function createRentalBookingController(req, res, next) {
    if (!req.user) {
        throw new Error('Unauthorized');
    }
    const params = rental_item_validator_1.rentalItemIdParamsSchema.safeParse(req.params);
    if (!params.success) {
        throw new Error('Invalid params');
    }
    const payload = rental_booking_validator_1.createRentalBookingSchema.safeParse(req.body);
    if (!payload.success) {
        throw new Error('Invalid booking fields');
    }
    try {
        const created = await (0, rental_booking_service_1.createRentalBookingService)(req.user.userId, req.user.role, params.data, payload.data);
        res.json(created);
    }
    catch (error) {
        next(error);
    }
}
