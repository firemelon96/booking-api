"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailability = getAvailability;
const availability_schema_1 = require("../validators/availability.schema");
const availability_service_1 = require("../services/availability.service");
async function getAvailability(req, res) {
    try {
        const tourId = req.params.tourId;
        if (Array.isArray(tourId)) {
            return res.status(400).json({ error: 'Invalid id' });
        }
        const query = availability_schema_1.availabilityQuerySchema.parse(req.query);
        const data = await (0, availability_service_1.getTourAvailability)({
            tourId,
            start: query.start,
            end: query.end,
            pricingType: query.pricingType,
        });
        return res.json({
            tourId,
            start: query.start,
            end: query.end,
            availability: data,
        });
    }
    catch (err) {
        const msg = String(err?.message || 'Error');
        return res
            .status(msg.includes('not found') ? 404 : 400)
            .json({ error: msg });
    }
}
