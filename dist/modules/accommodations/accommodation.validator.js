"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.accommodationSlugParams = exports.accommodationQuerySchema = exports.updateAccommodationSchema = exports.createAccommodationSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const enums_1 = require("../../generated/prisma/enums");
exports.createAccommodationSchema = zod_1.default.object({
    name: zod_1.default.string().min(2),
    type: zod_1.default.enum(enums_1.AccommodationType),
    description: zod_1.default.string().optional(),
    address: zod_1.default.string().optional(),
    city: zod_1.default.string().optional(),
    province: zod_1.default.string().optional(),
    country: zod_1.default.string().optional(),
    latitude: zod_1.default.number().optional(),
    longitude: zod_1.default.number().optional(),
    checkInTime: zod_1.default.string().optional(),
    checkOutTime: zod_1.default.string().optional(),
    hasUnits: zod_1.default.boolean().default(false),
    isBookable: zod_1.default.boolean().default(false),
    basePrice: zod_1.default.number().optional(),
    maxGuests: zod_1.default.number().optional(),
    amenityIds: zod_1.default.string().array().optional(),
});
exports.updateAccommodationSchema = exports.createAccommodationSchema.partial();
exports.accommodationQuerySchema = zod_1.default.object({
    page: zod_1.default.number().optional(),
    limit: zod_1.default.number().optional(),
    sort: zod_1.default.string().optional(),
    search: zod_1.default.string().optional(),
    type: zod_1.default.enum(enums_1.AccommodationType).optional(),
});
exports.accommodationSlugParams = zod_1.default.object({
    slug: zod_1.default.string(),
});
