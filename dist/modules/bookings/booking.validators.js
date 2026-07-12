"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingSchema = exports.reschedulBookingSchema = exports.bookingQuerySchema = exports.bookingIdParams = void 0;
const zod_1 = __importDefault(require("zod"));
const enums_1 = require("../../generated/prisma/enums");
exports.bookingIdParams = zod_1.default.object({
    bookingId: zod_1.default.string(),
});
exports.bookingQuerySchema = zod_1.default.object({
    page: zod_1.default.number().optional(),
    limit: zod_1.default.number().optional(),
    sort: zod_1.default.string().optional(),
    search: zod_1.default.string().optional(),
    reference: zod_1.default.string().optional(),
    type: zod_1.default.enum(enums_1.ServiceType).optional(),
    bookingStatus: zod_1.default.enum(enums_1.BookingStatus).optional(),
    paymentStatus: zod_1.default.enum(enums_1.PaymentStatus).optional(),
    totalPrice: zod_1.default.number().optional(),
    paidAmount: zod_1.default.number().optional(),
    remainingBalance: zod_1.default.number().optional(),
});
exports.reschedulBookingSchema = zod_1.default.object({
    startDate: zod_1.default.coerce.date().optional(),
    endDate: zod_1.default.coerce.date().optional(),
    scheduleId: zod_1.default.string().optional(),
    travelDate: zod_1.default.coerce.date().optional(),
    checkIn: zod_1.default.coerce.date().optional(),
    checkOut: zod_1.default.coerce.date().optional(),
    reason: zod_1.default.string().optional(),
});
exports.bookingSchema = zod_1.default.object({
    bookingId: zod_1.default.string(),
    userId: zod_1.default.string(),
    role: zod_1.default.enum(enums_1.Role),
});
