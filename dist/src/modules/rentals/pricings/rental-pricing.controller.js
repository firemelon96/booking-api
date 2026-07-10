"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRentalPricingController = updateRentalPricingController;
exports.deleteRentalPricingController = deleteRentalPricingController;
exports.createRentalPricingController = createRentalPricingController;
const rental_pricing_validator_1 = require("./rental-pricing.validator");
const rental_pricing_service_1 = require("./rental-pricing.service");
const rental_item_validator_1 = require("../items/rental-item.validator");
async function updateRentalPricingController(req, res, next) {
    const params = rental_pricing_validator_1.rentalPricingIdParamsSchema.safeParse(req.params);
    const payload = rental_pricing_validator_1.updateRentalPricingBodySchema.safeParse(req.body);
    if (!payload.success) {
        return res.status(400).json({ error: 'Invalid request body' });
    }
    if (!params.success) {
        return res.status(400).json({ error: 'Invalid query parameters' });
    }
    try {
        const updatedPricing = await (0, rental_pricing_service_1.updateRentalPricingService)(params.data, payload.data);
        res.json(updatedPricing);
    }
    catch (error) {
        next(error);
    }
}
async function deleteRentalPricingController(req, res, next) {
    const params = rental_pricing_validator_1.rentalPricingIdParamsSchema.safeParse(req.params);
    if (!params.success) {
        return res.status(400).json({ error: 'Invalid query parameters' });
    }
    try {
        await (0, rental_pricing_service_1.deleteRentalPricingService)(params.data);
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
}
async function createRentalPricingController(req, res, next) {
    const rentalItemIdParams = rental_item_validator_1.rentalItemIdParamsSchema.safeParse(req.params);
    const payload = rental_pricing_validator_1.createRentalPricingBodySchema.safeParse(req.body);
    if (!payload.success) {
        return res.status(400).json({ error: 'Invalid request body' });
    }
    if (!rentalItemIdParams.success) {
        return res.status(400).json({ error: 'Invalid query parameters' });
    }
    try {
        const createdPricing = await (0, rental_pricing_service_1.createRentalPricingService)(rentalItemIdParams.data.itemId, payload.data);
        res.status(201).json(createdPricing);
    }
    catch (error) {
        next(error);
    }
}
