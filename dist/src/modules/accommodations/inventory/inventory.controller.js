"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeInventoryController = closeInventoryController;
exports.openInventoryController = openInventoryController;
const inventory_validator_1 = require("./inventory.validator");
const accommodation_booking_validator_1 = require("../booking/accommodation-booking.validator");
const inventory_close_service_1 = require("./inventory-close.service");
async function closeInventoryController(req, res, next) {
    const params = accommodation_booking_validator_1.accommodationIdParams.safeParse(req.params);
    const payload = inventory_validator_1.closeInventorySchema.safeParse(req.body);
    if (!params.success || !payload.success) {
        throw new Error('Invalid params or fields');
    }
    try {
        const closedDates = await (0, inventory_close_service_1.closeInventoryService)(params.data.accommodationId, payload.data);
        res.json(closedDates);
    }
    catch (error) {
        next(error);
    }
}
async function openInventoryController(req, res, next) {
    const params = accommodation_booking_validator_1.accommodationIdParams.safeParse(req.params);
    const payload = inventory_validator_1.closeInventorySchema.safeParse(req.body);
    if (!params.success || !payload.success) {
        throw new Error('Invalid params or fields');
    }
    try {
        const closedDates = await (0, inventory_close_service_1.openInventoryService)(params.data.accommodationId, payload.data);
        res.json(closedDates);
    }
    catch (error) {
        next(error);
    }
}
