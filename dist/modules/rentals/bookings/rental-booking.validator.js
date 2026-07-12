"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rescheduleRentalBookingSchema = exports.createRentalBookingSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const enums_1 = require("../../../generated/prisma/enums");
exports.createRentalBookingSchema = zod_1.default.object({
    startDate: zod_1.default.coerce.date(),
    endDate: zod_1.default.coerce.date(),
    quantity: zod_1.default.number(),
    pricingType: zod_1.default.enum(enums_1.RentalPricingType),
    pickupLocation: zod_1.default.string().optional(),
    returnLocation: zod_1.default.string().optional(),
    notes: zod_1.default.string().optional(),
});
exports.rescheduleRentalBookingSchema = zod_1.default.object({
    startDate: zod_1.default.coerce.date(),
    endDate: zod_1.default.coerce.date(),
});
