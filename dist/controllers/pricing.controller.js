"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculatePricing = calculatePricing;
const pricing_schema_1 = require("../validators/pricing.schema");
const pricing_service_1 = require("../services/pricing.service");
async function calculatePricing(req, res) {
    try {
        const data = pricing_schema_1.calculatePricingSchema.parse(req.body);
        const result = await (0, pricing_service_1.calculateTotalPrice)({
            tourId: data.tourId,
            pricingType: data.pricingType,
            participants: data.participants,
        });
        res.json({
            totalPrice: result.totalPrice,
            currency: result.currency,
            matched: {
                id: result.matchedPricing.id,
                PricingType: result.matchedPricing.pricingType,
                minGroupSize: result.matchedPricing.minGroupSize,
                maxGroupSize: result.matchedPricing.maxGroupSize,
                price: result.matchedPricing.price,
                isGroupPrice: result.matchedPricing.isGroupPrice,
            },
        });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
}
