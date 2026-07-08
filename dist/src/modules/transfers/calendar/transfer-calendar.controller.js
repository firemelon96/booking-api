"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTransferCalendarController = getTransferCalendarController;
const transfer_calendar_validator_1 = require("./transfer-calendar.validator");
const transfer_calendar_service_1 = require("./transfer-calendar.service");
const transfer_validator_1 = require("../transfer.validator");
async function getTransferCalendarController(req, res, next) {
    const params = transfer_validator_1.transferSlugParams.safeParse(req.params);
    if (!params.success) {
        return res.status(400).json({ error: 'Invalid transfer slug' });
    }
    const payload = transfer_calendar_validator_1.transferCalendarQuerySchema.safeParse(req.query);
    if (!payload.success) {
        return res.status(400).json({ error: 'Invalid query parameters' });
    }
    try {
        const availability = await (0, transfer_calendar_service_1.getTransferCalendarService)(params.data.slug, payload.data);
        return res.json(availability);
    }
    catch (error) {
        next(error);
    }
}
