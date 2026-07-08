"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.accommodationIdParams = exports.rescheduleAccommodationBookingSchema = exports.createAccommodationBookingSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.createAccommodationBookingSchema = zod_1.default
    .object({
    unitId: zod_1.default.uuid().optional(),
    checkIn: zod_1.default.coerce.date(),
    checkOut: zod_1.default.coerce.date(),
    adults: zod_1.default.number(),
    units: zod_1.default.number().int().min(1).default(1),
    children: zod_1.default.number().optional(),
    specialRequests: zod_1.default.string().optional(),
})
    .refine((b) => b.checkOut > b.checkIn, {
    message: 'Check out must be after check in',
    path: ['checkOut'],
});
exports.rescheduleAccommodationBookingSchema = zod_1.default.object({
    checkIn: zod_1.default.coerce.date(),
    checkOut: zod_1.default.coerce.date(),
});
exports.accommodationIdParams = zod_1.default.object({
    accommodationId: zod_1.default.uuid(),
});
