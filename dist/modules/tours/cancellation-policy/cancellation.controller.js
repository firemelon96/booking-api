"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPolicy = createPolicy;
exports.modifyPolicy = modifyPolicy;
exports.deletePolicy = deletePolicy;
const cancellation_validator_1 = require("./cancellation.validator");
const cancellation_service_1 = require("./cancellation.service");
async function createPolicy(req, res, next) {
    const input = {
        ...req.params,
        ...req.body,
    };
    const payload = cancellation_validator_1.cancellationPolicySchema.safeParse(input);
    if (!payload.success) {
        throw new Error('Invalid fields');
    }
    try {
        const created = await (0, cancellation_service_1.addCancellationPolicy)(payload.data);
        res.json(created);
    }
    catch (error) {
        next(error);
    }
}
async function modifyPolicy(req, res, next) {
    const input = {
        ...req.params,
        ...req.body,
    };
    const payload = cancellation_validator_1.cancellationPolicySchema.safeParse(input);
    if (!payload.success) {
        throw new Error('Invalid fields');
    }
    try {
        const modified = await (0, cancellation_service_1.modifiedPolicy)(payload.data);
        res.json(modified);
    }
    catch (error) {
        next(error);
    }
}
async function deletePolicy(req, res, next) {
    const { tourId } = req.params;
    if (Array.isArray(tourId)) {
        throw new Error('Invalid params');
    }
    try {
        await (0, cancellation_service_1.deletedPolicy)(tourId);
        res.json({ success: true });
    }
    catch (error) {
        next(error);
    }
}
