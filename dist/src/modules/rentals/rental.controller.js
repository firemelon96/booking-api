"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllRentalsController = getAllRentalsController;
exports.getRentalDetailController = getRentalDetailController;
exports.createRentalController = createRentalController;
exports.updateRentalController = updateRentalController;
exports.removeRentalController = removeRentalController;
const rental_validator_1 = require("./rental.validator");
const rental_service_1 = require("./rental.service");
async function getAllRentalsController(req, res, next) {
    const query = rental_validator_1.rentalQuerySchema.safeParse(req.query);
    if (!query.success) {
        return res.status(400).json({ error: 'Invalid query parameters' });
    }
    try {
        const rentals = await (0, rental_service_1.getAllRentalsService)(query.data);
        res.json(rentals);
    }
    catch (error) {
        next(error);
    }
}
async function getRentalDetailController(req, res, next) {
    const params = rental_validator_1.rentalSlugParamsSchema.safeParse(req.params);
    if (!params.success) {
        return res.status(400).json({ error: 'Invalid query parameters' });
    }
    try {
        const rental = await (0, rental_service_1.getRentalDetailService)(params.data.slug);
        res.json(rental);
    }
    catch (error) {
        next(error);
    }
}
async function createRentalController(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const payload = rental_validator_1.createRentalBodySchema.safeParse(req.body);
    if (!payload.success) {
        return res.status(400).json({ error: 'Invalid request body' });
    }
    try {
        const created = await (0, rental_service_1.createRentalService)(req.user.userId, payload.data);
        res.status(201).json(created);
    }
    catch (error) {
        next(error);
    }
}
async function updateRentalController(req, res, next) {
    const params = rental_validator_1.rentalIdParamsSchema.safeParse(req.params);
    if (!params.success) {
        return res.status(400).json({ error: 'Invalid query parameters' });
    }
    const payload = rental_validator_1.updateRentalBodySchema.safeParse(req.body);
    if (!payload.success) {
        return res.status(400).json({ error: 'Invalid request body' });
    }
    try {
        const updated = await (0, rental_service_1.updateRentalService)(params.data.rentalId, payload.data);
        res.json(updated);
    }
    catch (error) {
        next(error);
    }
}
async function removeRentalController(req, res, next) {
    const params = rental_validator_1.rentalIdParamsSchema.safeParse(req.params);
    if (!params.success) {
        return res.status(400).json({ error: 'Invalid query parameters' });
    }
    try {
        await (0, rental_service_1.removeRentalService)(params.data.rentalId);
        res.status(200).send({ message: 'Rental removed successfully' });
    }
    catch (error) {
        next(error);
    }
}
