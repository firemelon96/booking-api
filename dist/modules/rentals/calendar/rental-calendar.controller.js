"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rentalItemCalendarAvailability = rentalItemCalendarAvailability;
const rental_calendar_validator_1 = require("./rental-calendar.validator");
const rental_calendar_service_1 = require("./rental-calendar.service");
async function rentalItemCalendarAvailability(req, res, next) {
    const payload = rental_calendar_validator_1.rentalCalendarSchema.safeParse(req.body);
    if (!payload.success) {
        throw new Error('Invalid query params');
    }
    try {
        const calendarAvailability = await (0, rental_calendar_service_1.rentalItemAvailabilityService)(payload.data);
        res.json(calendarAvailability);
    }
    catch (error) {
        next(error);
    }
}
