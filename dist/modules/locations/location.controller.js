"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addLocationController = addLocationController;
exports.updateLocationController = updateLocationController;
exports.removeLocationController = removeLocationController;
exports.listLocationController = listLocationController;
const location_validator_1 = require("./location.validator");
const location_service_1 = require("./location.service");
async function addLocationController(req, res, next) {
    const payload = location_validator_1.addLocationSchema.safeParse(req.body);
    if (!payload.success) {
        throw new Error('Invalid fields');
    }
    try {
        const addedLocation = await (0, location_service_1.addLocationService)(payload.data);
        res.status(201).json(addedLocation);
    }
    catch (error) {
        next(error);
    }
}
async function updateLocationController(req, res, next) {
    const locationId = location_validator_1.locationIdParams.safeParse(req.params);
    if (!locationId.success) {
        throw new Error('Invalid params');
    }
    const payload = location_validator_1.addLocationSchema.safeParse(req.body);
    if (!payload.success) {
        throw new Error('Invalid fields');
    }
    try {
        const addedLocation = await (0, location_service_1.updateLocationService)(locationId.data.locationId, payload.data);
        res.status(201).json(addedLocation);
    }
    catch (error) {
        next(error);
    }
}
async function removeLocationController(req, res, next) {
    const locationId = location_validator_1.locationIdParams.safeParse(req.params);
    if (!locationId.success) {
        throw new Error('Invalid params');
    }
    try {
        const addedLocation = await (0, location_service_1.removeLocationService)(locationId.data.locationId);
        res.status(201).json(addedLocation);
    }
    catch (error) {
        next(error);
    }
}
async function listLocationController(req, res, next) {
    const payload = location_validator_1.locationQuerySchema.safeParse(req.query);
    if (!payload.success) {
        throw new Error('Invalid fields');
    }
    try {
        const lists = await (0, location_service_1.listLocationService)(payload.data);
        res.json(lists);
    }
    catch (error) {
        next(error);
    }
}
