"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rentalQuerySchema = exports.updateRentalBodySchema = exports.createRentalBodySchema = exports.rentalSlugParamsSchema = exports.rentalIdParamsSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const enums_1 = require("../../generated/prisma/enums");
const rental_item_validator_1 = require("./items/rental-item.validator");
exports.rentalIdParamsSchema = zod_1.default.object({
    rentalId: zod_1.default.string(),
});
exports.rentalSlugParamsSchema = zod_1.default.object({
    slug: zod_1.default.string(),
});
exports.createRentalBodySchema = zod_1.default.object({
    name: zod_1.default.string(),
    description: zod_1.default.string().optional(),
    type: zod_1.default.enum(enums_1.RentalType),
    amenityIds: zod_1.default.string().array(),
    items: zod_1.default.array(rental_item_validator_1.rentalItemsSchema),
    imageIds: zod_1.default.string().array().optional(),
});
exports.updateRentalBodySchema = zod_1.default
    .object({
    name: zod_1.default.string(),
    description: zod_1.default.string().optional(),
    type: zod_1.default.enum(enums_1.RentalType),
    amenityIds: zod_1.default.array(zod_1.default.string()).optional(),
    imageIds: zod_1.default.array(zod_1.default.string()).optional(),
})
    .partial();
exports.rentalQuerySchema = zod_1.default.object({
    page: zod_1.default.number().optional(),
    limit: zod_1.default.number().optional(),
    sort: zod_1.default.string().optional(),
    search: zod_1.default.string().optional(),
    type: zod_1.default.enum(enums_1.RentalType).optional(),
});
