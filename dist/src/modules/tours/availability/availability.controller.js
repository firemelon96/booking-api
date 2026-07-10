"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blockDates = blockDates;
exports.unblockDates = unblockDates;
const availability_validator_1 = require("./availability.validator");
const availability_service_1 = require("./availability.service");
async function blockDates(req, res, next) {
    const { tourId } = req.params;
    if (Array.isArray(tourId)) {
        return res.status(400).json({ error: 'Invalid tourId' });
    }
    const payload = availability_validator_1.blockDatesSchema.safeParse(req.body);
    if (!payload.success) {
        return res.status(400).json({ error: 'Invalid fields' });
    }
    try {
        const result = await (0, availability_service_1.closeDates)({
            ...payload.data,
            tourId,
        });
        return res.status(200).json(result);
    }
    catch (error) {
        next(error);
    }
}
async function unblockDates(req, res, next) {
    const { tourId } = req.params;
    if (Array.isArray(tourId)) {
        return res.status(400).json({ error: 'Invalid tourId' });
    }
    const payload = availability_validator_1.blockDatesSchema.safeParse(req.body);
    if (!payload.success) {
        return res.status(400).json({ error: 'Invalid fields' });
    }
    try {
        const result = await (0, availability_service_1.openDates)({
            ...payload.data,
            tourId,
        });
        return res.status(200).json(result);
    }
    catch (error) {
        next(error);
    }
}
