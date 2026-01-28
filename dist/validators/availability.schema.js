"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.availabilityQuerySchema = void 0;
const zod_1 = require("zod");
exports.availabilityQuerySchema = zod_1.z.object({
    start: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'start must be YYYY-MM-DD'),
    end: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'end must be YYYY-MM-DD'),
    pricingType: zod_1.z.enum(['joiner', 'private']).optional(),
});
