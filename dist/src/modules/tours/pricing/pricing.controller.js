"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.replacePricing = replacePricing;
const pricing_validator_1 = require("./pricing.validator");
const pricing_service_1 = require("./pricing.service");
async function replacePricing(req, res, next) {
    const { tourId } = req.params;
    const payload = pricing_validator_1.createPricingArraySchema.safeParse(req.body);
    if (!payload.success) {
        throw new Error('Invalid fields');
    }
    if (Array.isArray(tourId)) {
        throw new Error('Invalid params');
    }
    try {
        const modified = await (0, pricing_service_1.modifyPricing)(tourId, payload.data);
        res.json(modified);
    }
    catch (error) {
        next(error);
    }
}
