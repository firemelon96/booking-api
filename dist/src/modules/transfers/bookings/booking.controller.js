"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTransferBookingController = createTransferBookingController;
exports.adminCreateTransferBookingController = adminCreateTransferBookingController;
const booking_service_1 = require("./booking.service");
const booking_validator_1 = require("./booking.validator");
const transfer_validator_1 = require("../transfer.validator");
async function createTransferBookingController(req, res, next) {
    if (!req.user) {
        throw new Error('Unauthorized');
    }
    const params = transfer_validator_1.transferIdParams.safeParse(req.params);
    if (!params.success) {
        throw new Error('Invalid params');
    }
    const payload = booking_validator_1.createTransferBookingSchema.safeParse(req.body);
    if (!payload.success) {
        throw new Error('Invalid fields');
    }
    try {
        const created = await (0, booking_service_1.createTransferBookingService)(params.data.transferId, req.user.userId, req.user.role, payload.data);
        res.json(created);
    }
    catch (error) {
        next(error);
    }
}
async function adminCreateTransferBookingController(req, res, next) {
    if (!req.user) {
        throw new Error('Unauthorized');
    }
    const { transferId, ...payloadData } = req.body;
    const payload = booking_validator_1.createTransferBookingSchema.safeParse(payloadData);
    if (!payload.success) {
        throw new Error('Invalid fields');
    }
    try {
        const created = await (0, booking_service_1.createTransferBookingService)(transferId, req.user.userId, req.user.role, payload.data);
        res.json(created);
    }
    catch (error) {
        next(error);
    }
}
