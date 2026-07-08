"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.likeTransferController = likeTransferController;
exports.unlikeTransferController = unlikeTransferController;
const like_service_1 = require("./like.service");
const transfer_validator_1 = require("../transfer.validator");
async function likeTransferController(req, res, next) {
    if (!req.user) {
        throw new Error('Unauthorized');
    }
    const params = transfer_validator_1.transferIdParams.safeParse(req.params);
    if (!params.success) {
        throw new Error('Invalid params');
    }
    try {
        await (0, like_service_1.likedTransfer)({
            transferId: params.data.transferId,
            userId: req.user.userId,
        });
        res.json({ success: true, message: 'Added to liked' });
    }
    catch (error) {
        next(error);
    }
}
async function unlikeTransferController(req, res, next) {
    if (!req.user) {
        throw new Error('Unauthorized');
    }
    const params = transfer_validator_1.transferIdParams.safeParse(req.params);
    if (!params.success) {
        throw new Error('Invalid params');
    }
    try {
        await (0, like_service_1.unlikeTransfer)({
            transferId: params.data.transferId,
            userId: req.user.userId,
        });
        res.json({ success: true, message: 'Remove from liked' });
    }
    catch (error) {
        next(error);
    }
}
