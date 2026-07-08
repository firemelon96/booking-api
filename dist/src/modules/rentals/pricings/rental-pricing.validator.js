"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rentalPricingIdParamsSchema = exports.updateRentalPricingBodySchema = exports.createRentalPricingBodySchema = void 0;
const zod_1 = __importDefault(require("zod"));
const enums_1 = require("../../../generated/prisma/enums");
exports.createRentalPricingBodySchema = zod_1.default.object({
    price: zod_1.default.number(),
    pricingType: zod_1.default.enum(enums_1.RentalPricingType),
});
exports.updateRentalPricingBodySchema = exports.createRentalPricingBodySchema.partial();
exports.rentalPricingIdParamsSchema = zod_1.default.object({
    rentalItemId: zod_1.default.string(),
    pricingId: zod_1.default.string(),
});
