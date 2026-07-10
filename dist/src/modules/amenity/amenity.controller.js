"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAmenities = getAmenities;
exports.createAmenity = createAmenity;
const amenity_service_1 = require("./amenity.service");
const amenity_validator_1 = require("./amenity.validator");
async function getAmenities(req, res, next) {
    try {
        const amenities = await (0, amenity_service_1.fetchAmenities)();
        res.json(amenities);
    }
    catch (error) {
        next(error);
    }
}
async function createAmenity(req, res, next) {
    const payload = amenity_validator_1.createAmenitySchema.safeParse(req.body);
    if (!payload.success) {
        throw new Error('Invalid fields');
    }
    try {
        const created = await (0, amenity_service_1.createdAmenity)(payload.data);
        res.json(created);
    }
    catch (error) {
        next(error);
    }
}
