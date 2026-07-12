"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transferFilterSchema = exports.transferQuerySchema = exports.transferSlugParams = exports.transferIdParams = exports.updateBaseTransferSchema = exports.baseTransferSchema = exports.createTransferSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const enums_1 = require("../../generated/prisma/enums");
const pricing_validator_1 = require("./pricings/pricing.validator");
const schedule_validator_1 = require("./schedules/schedule.validator");
exports.createTransferSchema = zod_1.default.object({
    name: zod_1.default.string().min(2),
    description: zod_1.default.string().optional(),
    type: zod_1.default.enum(enums_1.TransferType),
    originId: zod_1.default.string(),
    destinationId: zod_1.default.string(),
    pricingMode: zod_1.default.enum(enums_1.TransferPricingMode),
    hasSchedule: zod_1.default.boolean().optional(),
    pricing: pricing_validator_1.transferPricingSchema.array(),
    schedules: schedule_validator_1.transferScheduleSchema.array().optional(),
    amenityIds: zod_1.default.string().array(),
    imageIds: zod_1.default.string().array(),
});
exports.baseTransferSchema = zod_1.default.object({
    name: zod_1.default.string().min(2),
    description: zod_1.default.string().optional(),
    type: zod_1.default.enum(enums_1.TransferType),
    originId: zod_1.default.string(),
    destinationId: zod_1.default.string(),
    pricingMode: zod_1.default.enum(enums_1.TransferPricingMode),
    maxPassengers: zod_1.default.number(),
    hasSchedule: zod_1.default.boolean(),
});
exports.updateBaseTransferSchema = exports.baseTransferSchema.partial();
exports.transferIdParams = zod_1.default.object({
    transferId: zod_1.default.uuid(),
});
exports.transferSlugParams = zod_1.default.object({
    slug: zod_1.default.string(),
});
exports.transferQuerySchema = zod_1.default.object({
    limit: zod_1.default.number().optional(),
    search: zod_1.default.string().optional(),
    type: zod_1.default.enum(enums_1.TransferType).optional(),
    pricingMode: zod_1.default.enum(enums_1.TransferPricingMode).optional(),
    cursor: zod_1.default.string().optional(),
    page: zod_1.default.number().optional(),
    sort: zod_1.default.string().optional(),
});
exports.transferFilterSchema = zod_1.default.object({
    search: zod_1.default.string().optional(),
    pricingMode: zod_1.default.enum(enums_1.TransferPricingMode).optional(),
    type: zod_1.default.enum(enums_1.TransferType).optional(),
});
//add more after pushing the database online
