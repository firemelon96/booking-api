"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAccommodationCalendarController = getAccommodationCalendarController;
const calendar_validator_1 = require("./calendar.validator");
const calendar_service_1 = require("./calendar.service");
async function getAccommodationCalendarController(req, res, next) {
    const { slug } = req.params;
    if (Array.isArray(slug)) {
        throw new Error('invalid params');
    }
    const payload = calendar_validator_1.calendarQuerySchema.safeParse(req.query);
    if (!payload.success) {
        throw new Error('Invalid fields');
    }
    try {
        const results = await (0, calendar_service_1.calendarAccommodationService)(slug, payload.data);
        res.json(results);
    }
    catch (error) {
        next(error);
    }
}
