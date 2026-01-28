"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculatePricingSchema = void 0;
const zod_1 = require("zod");
exports.calculatePricingSchema = zod_1.z.object({
    tourId: zod_1.z.uuid(),
    pricingType: zod_1.z.enum(['joiner', 'private']),
    participants: zod_1.z.number().int().min(1).max(100),
});
