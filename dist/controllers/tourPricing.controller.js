"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.list = list;
exports.create = create;
exports.update = update;
exports.remove = remove;
const tourPricing_schema_1 = require("../validators/tourPricing.schema");
const tourPricing_service_1 = require("../services/tourPricing.service");
async function list(req, res) {
    try {
        const tourId = req.params.tourId;
        if (Array.isArray(tourId)) {
            throw new Error('Invalid tour id');
        }
        const data = await (0, tourPricing_service_1.listTourPricing)(tourId);
        res.json(data);
    }
    catch (err) {
        res
            .status(err.message?.includes('not found') ? 404 : 400)
            .json({ error: err.message });
    }
}
async function create(req, res) {
    try {
        const tourId = req.params.tourId;
        if (Array.isArray(tourId)) {
            throw new Error('Invalid tour id');
        }
        const body = tourPricing_schema_1.createTourPricingSchema.parse(req.body);
        const created = await (0, tourPricing_service_1.createTourPricing)({
            tourId,
            pricingType: body.pricingType,
            minGroupSize: body.minGroupSize,
            maxGroupSize: body.maxGroupSize,
            price: body.price,
            isGroupPrice: body.isGroupPrice ?? false,
        });
        res.status(201).json(created);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
}
async function update(req, res) {
    try {
        const tourId = req.params.tourId;
        const pricingId = req.params.pricingId;
        if (Array.isArray(tourId) || Array.isArray(pricingId)) {
            throw new Error('Invalid params type');
        }
        const body = tourPricing_schema_1.updateTourPricingSchema.parse(req.body);
        const updated = await (0, tourPricing_service_1.updateTourPricing)({
            tourId,
            pricingId,
            ...body,
        });
        res.json(updated);
    }
    catch (err) {
        res
            .status(err.message?.includes('not found') ? 404 : 400)
            .json({ error: err.message });
    }
}
async function remove(req, res) {
    try {
        const tourId = req.params.tourId;
        const pricingId = req.params.pricingId;
        if (Array.isArray(tourId) || Array.isArray(pricingId)) {
            throw new Error('Invalid params type');
        }
        await (0, tourPricing_service_1.deleteTourPricing)({ tourId, pricingId });
        res.status(204).send();
    }
    catch (err) {
        res
            .status(err.message?.includes('not found') ? 404 : 400)
            .json({ error: err.message });
    }
}
