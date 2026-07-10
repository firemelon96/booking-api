"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRentalItemController = createRentalItemController;
exports.bulkCreateRentalItemsController = bulkCreateRentalItemsController;
exports.updateRentalItemController = updateRentalItemController;
exports.removeRentalItemController = removeRentalItemController;
const rental_validator_1 = require("../rental.validator");
const rental_item_validator_1 = require("./rental-item.validator");
const rental_item_service_1 = require("./rental-item.service");
async function createRentalItemController(req, res, next) {
    const params = rental_validator_1.rentalIdParamsSchema.safeParse(req.params);
    const payload = rental_item_validator_1.rentalItemsSchema.safeParse(req.body);
    if (!payload.success) {
        return res.status(400).json({ error: 'Invalid request body' });
    }
    if (!params.success) {
        return res.status(400).json({ error: 'Invalid query parameters' });
    }
    try {
        const createdItem = await (0, rental_item_service_1.createRentalItemService)(params.data.rentalId, payload.data);
        res.status(201).json(createdItem);
    }
    catch (error) {
        next(error);
    }
}
async function bulkCreateRentalItemsController(req, res, next) {
    const params = rental_validator_1.rentalIdParamsSchema.safeParse(req.params);
    const payload = rental_item_validator_1.rentalItemsSchema.array().safeParse(req.body);
    if (!payload.success) {
        return res.status(400).json({ error: 'Invalid request body' });
    }
    if (!params.success) {
        return res.status(400).json({ error: 'Invalid query parameters' });
    }
    try {
        const createdItems = await (0, rental_item_service_1.createBulkRentalItemsService)(params.data.rentalId, payload.data);
        res.status(201).json(createdItems);
    }
    catch (error) {
        next(error);
    }
}
async function updateRentalItemController(req, res, next) {
    const params = rental_item_validator_1.rentalItemIdParamsSchema.safeParse(req.params);
    const payload = rental_item_validator_1.rentalItemsSchema.safeParse(req.body);
    if (!payload.success) {
        return res.status(400).json({ error: 'Invalid request body' });
    }
    if (!params.success) {
        return res.status(400).json({ error: 'Invalid query parameters' });
    }
    try {
        const updatedItem = await (0, rental_item_service_1.updateRentalItemService)(params.data, payload.data);
        res.status(200).json(updatedItem);
    }
    catch (error) {
        next(error);
    }
}
async function removeRentalItemController(req, res, next) {
    const params = rental_item_validator_1.rentalItemIdParamsSchema.safeParse(req.params);
    if (!params.success) {
        return res.status(400).json({ error: 'Invalid query parameters' });
    }
    try {
        await (0, rental_item_service_1.removeRentalItemService)(params.data);
        res.status(200).json({ message: 'Rental item removed successfully' });
    }
    catch (error) {
        next(error);
    }
}
