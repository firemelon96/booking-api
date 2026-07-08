"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTourBookingSchema = exports.tourReschedPayload = void 0;
const zod_1 = __importDefault(require("zod"));
const enums_1 = require("../../../generated/prisma/enums");
exports.tourReschedPayload = zod_1.default.object({
    newStartDate: zod_1.default.coerce.date(),
    newEndDate: zod_1.default.coerce.date(),
    scheduleId: zod_1.default.string().optional(),
});
exports.createTourBookingSchema = zod_1.default.object({
    pricingType: zod_1.default.enum(enums_1.PricingType),
    participants: zod_1.default.number().int().min(1).max(100),
    startDate: zod_1.default.coerce.date(),
    endDate: zod_1.default.coerce.date().optional(),
    scheduleId: zod_1.default.string().optional(),
    notes: zod_1.default.string().optional(),
});
