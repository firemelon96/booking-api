"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateImagesController = updateImagesController;
exports.setFeaturedController = setFeaturedController;
const image_service_1 = require("./image.service");
const transfer_validator_1 = require("../transfer.validator");
const image_validator_1 = require("./image.validator");
async function updateImagesController(req, res, next) {
    const params = transfer_validator_1.transferIdParams.safeParse(req.params);
    if (!params.success) {
        throw new Error('Invalid params');
    }
    const payload = image_validator_1.imageSchema.safeParse(req.body);
    if (!payload.success) {
        throw new Error('Invalid fields');
    }
    try {
        await (0, image_service_1.updateTransferImages)(params.data.transferId, payload.data);
        res.json({ success: true, message: 'Images updated successfully.' });
    }
    catch (error) {
        next(error);
    }
}
async function setFeaturedController(req, res, next) {
    const params = image_validator_1.setFeaturedParams.safeParse(req.params);
    if (!params.success) {
        throw new Error('Invalid params');
    }
    try {
        await (0, image_service_1.setFeaturedService)(params.data);
        res.json({ message: 'Image featured set!' });
    }
    catch (error) {
        next(error);
    }
}
