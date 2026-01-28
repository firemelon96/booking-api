"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTourPricingSchema = exports.createTourPricingSchema = void 0;
const zod_1 = require("zod");
const pricingTypeEnum = zod_1.z.enum(['joiner', 'private']);
exports.createTourPricingSchema = zod_1.z
    .object({
    pricingType: pricingTypeEnum,
    minGroupSize: zod_1.z.number().int().min(1),
    maxGroupSize: zod_1.z.number().int().min(1),
    price: zod_1.z.number().int().min(0),
    isGroupPrice: zod_1.z.boolean().optional().default(false),
})
    .refine((d) => d.minGroupSize <= d.maxGroupSize, {
    message: 'Min group size must be less than or equals max group size',
    path: ['minGroupSize'],
});
exports.updateTourPricingSchema = zod_1.z
    .object({
    pricingType: pricingTypeEnum.optional(),
    minGroupSize: zod_1.z.number().int().min(1).optional(),
    maxGroupSize: zod_1.z.number().int().min(1).optional(),
    price: zod_1.z.number().int().min(0).optional(),
    isGroupPrice: zod_1.z.boolean().optional(),
})
    .refine((d) => {
    if (d.minGroupSize !== undefined && d.maxGroupSize !== undefined) {
        return d.minGroupSize <= d.maxGroupSize;
    }
    return true;
}, {
    message: 'minGroupSize must be <= maxGroupSize',
    path: ['minGroupSize'],
});
