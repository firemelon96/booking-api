"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rescheduleTransferBookingSchema = exports.createTransferBookingSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const enums_1 = require("../../../generated/prisma/enums");
exports.createTransferBookingSchema = zod_1.default.object({
    scheduleId: zod_1.default.string().optional(),
    travelDate: zod_1.default.coerce.date(),
    passengers: zod_1.default.number(),
    pricingType: zod_1.default.enum(enums_1.PricingType),
    pickupLocation: zod_1.default.string().optional(),
    dropoffLocation: zod_1.default.string().optional(),
});
exports.rescheduleTransferBookingSchema = zod_1.default.object({
    travelDate: zod_1.default.coerce.date(),
    scheduleId: zod_1.default.string().optional(),
});
