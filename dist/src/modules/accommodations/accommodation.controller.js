"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAccommodationDetailController = getAccommodationDetailController;
exports.createAccommodation = createAccommodation;
exports.getAccommodations = getAccommodations;
exports.updateAccommodation = updateAccommodation;
exports.removeAccommodation = removeAccommodation;
const accommodation_validator_1 = require("./accommodation.validator");
const accommodation_service_1 = require("./accommodation.service");
async function getAccommodationDetailController(req, res, next) {
    const params = accommodation_validator_1.accommodationSlugParams.safeParse(req.params);
    if (!params.success) {
        throw new Error('Invalid slug');
    }
    try {
        const detail = await (0, accommodation_service_1.getAccommodationDetailService)(params.data.slug);
        res.json(detail);
    }
    catch (error) {
        next(error);
    }
}
async function createAccommodation(req, res, next) {
    if (!req.user) {
        throw new Error('Unauthorized');
    }
    const ownerId = req.user.userId;
    const payload = accommodation_validator_1.createAccommodationSchema.safeParse(req.body);
    if (!payload.success) {
        throw new Error('Invalid fields');
    }
    try {
        const created = await (0, accommodation_service_1.createdAccommodation)(ownerId, payload.data);
        res.json(created);
    }
    catch (error) {
        next(error);
    }
}
async function getAccommodations(req, res, next) {
    const payload = accommodation_validator_1.accommodationQuerySchema.safeParse(req.query);
    if (!payload.success) {
        throw new Error('Invalid fields');
    }
    try {
        const accommodations = await (0, accommodation_service_1.listAccommodation)(payload.data);
        res.json(accommodations);
    }
    catch (error) {
        next(error);
    }
}
async function updateAccommodation(req, res, next) {
    const { accommodationId } = req.params;
    if (Array.isArray(accommodationId)) {
        throw new Error('Invalid params');
    }
    const payload = accommodation_validator_1.updateAccommodationSchema.safeParse(req.body);
    if (!payload.success) {
        throw new Error('Invalid fields');
    }
    try {
        const updated = await (0, accommodation_service_1.updatedAccommodation)(accommodationId, payload.data);
        res.json(updated);
    }
    catch (error) {
        next(error);
    }
}
async function removeAccommodation(req, res, next) {
    const { accommodationId } = req.params;
    if (Array.isArray(accommodationId)) {
        throw new Error('Invalid params');
    }
    try {
        await (0, accommodation_service_1.removedAccommodation)(accommodationId);
        res.json({ success: true, message: 'Deleted successfully.' });
    }
    catch (error) {
        next(error);
    }
}
