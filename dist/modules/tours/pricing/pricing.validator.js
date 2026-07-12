"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPricingArraySchema = exports.createTourPricingSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("../../../generated/prisma/enums");
exports.createTourPricingSchema = zod_1.z
    .object({
    pricingType: zod_1.z.enum(enums_1.PricingType),
    minGroupSize: zod_1.z.number().int().min(1),
    maxGroupSize: zod_1.z.number().int().min(1),
    price: zod_1.z.number().int().min(0),
    pricingModel: zod_1.z.enum(enums_1.PricingModel),
})
    .refine((d) => d.minGroupSize <= d.maxGroupSize, {
    message: 'Min group size must be less than or equals max group size',
    path: ['minGroupSize'],
});
exports.createPricingArraySchema = zod_1.z.array(exports.createTourPricingSchema);
