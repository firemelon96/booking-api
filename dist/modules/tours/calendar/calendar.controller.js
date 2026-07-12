"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCalendarAvailability = getCalendarAvailability;
const calendar_validators_1 = require("./calendar.validators");
const calendar_service_1 = require("./calendar.service");
async function getCalendarAvailability(req, res, next) {
    const { slug } = req.params;
    const payload = calendar_validators_1.calendarQuery.safeParse(req.query);
    if (Array.isArray(slug) || !slug) {
        return res.status(400).json({ error: 'Invalid tour slug' });
    }
    if (!payload.success) {
        return res.status(400).json({ error: 'Invalid query parameters' });
    }
    try {
        const results = await (0, calendar_service_1.calendarAvailability)({
            slug,
            ...payload.data,
        });
        return res.json(results);
    }
    catch (error) {
        next(error);
    }
}
