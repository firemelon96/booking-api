"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllTransferController = getAllTransferController;
exports.getTransferBySlugController = getTransferBySlugController;
exports.createTransferController = createTransferController;
exports.updateTransferController = updateTransferController;
exports.removeTransferController = removeTransferController;
const transfer_validator_1 = require("./transfer.validator");
const transfer_service_1 = require("./transfer.service");
async function getAllTransferController(req, res, next) {
    const payload = transfer_validator_1.transferQuerySchema.safeParse(req.query);
    if (!payload.success) {
        throw new Error('Invalid fields');
    }
    try {
        const transfersList = await (0, transfer_service_1.getAllTransferService)(payload.data);
        res.json(transfersList);
    }
    catch (error) {
        next(error);
    }
}
async function getTransferBySlugController(req, res, next) {
    const params = transfer_validator_1.transferSlugParams.safeParse(req.params);
    if (!params.success) {
        throw new Error('Invalid params');
    }
    try {
        const detailedTransfer = await (0, transfer_service_1.getTransferBySlugService)(params.data.slug);
        res.json(detailedTransfer);
    }
    catch (error) {
        next(error);
    }
}
async function createTransferController(req, res, next) {
    if (!req.user) {
        throw new Error('Unauthorized');
    }
    const payload = transfer_validator_1.createTransferSchema.safeParse(req.body);
    if (!payload.success) {
        throw new Error('Invalid fields');
    }
    try {
        const created = await (0, transfer_service_1.createdTransferService)(req.user.userId, payload.data);
        res.status(201).json(created);
    }
    catch (error) {
        next(error);
    }
}
async function updateTransferController(req, res, next) {
    const { transferId } = req.params;
    if (Array.isArray(transferId)) {
        throw new Error('Invalid params');
    }
    const payload = transfer_validator_1.updateBaseTransferSchema.safeParse(req.body);
    if (!payload.success) {
        throw new Error('Invalid fields');
    }
    try {
        const created = await (0, transfer_service_1.updatedTransferService)(transferId, payload.data);
        res.json(created);
    }
    catch (error) {
        next(error);
    }
}
async function removeTransferController(req, res, next) {
    const payload = transfer_validator_1.transferIdParams.safeParse(req.params);
    if (!payload.success) {
        throw new Error('Invalid fields');
    }
    try {
        await (0, transfer_service_1.removedTransferService)(payload.data.transferId);
        res.json({ success: true, message: 'Deleted successfully' });
    }
    catch (error) {
        next(error);
    }
}
