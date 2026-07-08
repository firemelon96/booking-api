"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rentalItemIdParamsSchema = exports.rentalItemsSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const rental_pricing_validator_1 = require("../pricings/rental-pricing.validator");
exports.rentalItemsSchema = zod_1.default.object({
    name: zod_1.default.string(),
    description: zod_1.default.string().optional(),
    itemCode: zod_1.default.string(),
    quantity: zod_1.default.number().optional(),
    pricing: zod_1.default.array(rental_pricing_validator_1.createRentalPricingBodySchema),
    imageIds: zod_1.default.string().array(),
});
exports.rentalItemIdParamsSchema = zod_1.default.object({
    rentalId: zod_1.default.string(),
    itemId: zod_1.default.string(),
});
