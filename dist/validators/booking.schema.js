"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBookingSchema = void 0;
const zod_1 = require("zod");
exports.createBookingSchema = zod_1.z
    .object({
    tourId: zod_1.z.uuid(),
    pricingType: zod_1.z.enum(['joiner', 'private']),
    participants: zod_1.z.number().int().min(1).max(100),
    startDate: zod_1.z.iso.datetime(),
    endDate: zod_1.z.iso.datetime().optional(),
})
    .refine((d) => {
    if (!d.endDate)
        return true;
    return new Date(d.endDate).getTime() >= new Date(d.startDate).getTime();
}, {
    message: 'End date must be Greater than the start date',
    path: ['endDate'],
})
    .refine((d) => {
    if (d.pricingType === 'joiner')
        return !d.endDate;
    return true;
}, {
    message: 'Joiner bookings must be single-day (no end date).',
    path: ['endDate'],
});
