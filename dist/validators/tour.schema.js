"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFullTourSchema = exports.updateTourSchema = exports.createTourSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const itinerary_schema_1 = require("./itinerary.schema");
const tourPricing_schema_1 = require("./tourPricing.schema");
exports.createTourSchema = zod_1.default.object({
    name: zod_1.default.string().min(2).max(120),
    slug: zod_1.default
        .string()
        .min(2)
        .max(140)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be kebab-case')
        .optional(),
    imageIds: zod_1.default.string().array(),
});
exports.updateTourSchema = zod_1.default.object({
    name: zod_1.default.string().min(2).max(120),
    slug: zod_1.default
        .string()
        .min(2)
        .max(140)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be kebab-case')
        .optional(),
    existingImageIds: zod_1.default.string().array(),
    newImageIds: zod_1.default.string().array(),
});
exports.createFullTourSchema = zod_1.default.object({
    name: zod_1.default.string().min(2).max(120),
    slug: zod_1.default
        .string()
        .min(2)
        .max(140)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be kebab-case')
        .optional(),
    // description: z.string().min(20).max(200),
    // address: z.string(),
    // inclusions: z.string().array(),
    // exclusions: z.string().array(),
    imageIds: zod_1.default.string().array(),
    itineraries: itinerary_schema_1.createItinerarySchema.array(),
    pricing: tourPricing_schema_1.createTourPricingSchema.array(),
});
