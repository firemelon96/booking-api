"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.modifyTransferPricingController = modifyTransferPricingController;
const transfer_validator_1 = require("../transfer.validator");
const pricing_validator_1 = require("./pricing.validator");
const pricing_service_1 = require("./pricing.service");
async function modifyTransferPricingController(req, res, next) {
    const params = transfer_validator_1.transferIdParams.safeParse(req.params);
    if (!params.success) {
        throw new Error('Invalid params');
    }
    const payload = pricing_validator_1.transferPricingSchema.array().safeParse(req.body);
    if (!payload.success) {
        throw new Error('Invalid fields');
    }
    try {
        const modifiedPricing = await (0, pricing_service_1.modifyTransferPricing)(params.data.transferId, payload.data);
        res.json(modifiedPricing);
    }
    catch (error) {
        next(error);
    }
}
