"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tourIdParams = exports.tourParamsSchema = exports.updatePartialTourSchema = exports.createFullTourSchema = exports.exclusionSchema = exports.inclusionSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("../../generated/prisma/enums");
const itinerary_validator_1 = require("./itinerary/itinerary.validator");
const pricing_validator_1 = require("./pricing/pricing.validator");
exports.inclusionSchema = zod_1.z.object({
    title: zod_1.z.string(),
    description: zod_1.z.string().optional(),
});
exports.exclusionSchema = zod_1.z.object({
    title: zod_1.z.string(),
    description: zod_1.z.string().optional(),
});
const scheduleSchema = zod_1.z.object({
    label: zod_1.z.string(),
    startTime: zod_1.z.string().optional(),
    endTime: zod_1.z.string().optional(),
    maxParticipants: zod_1.z.number().optional(),
});
exports.createFullTourSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(120),
    description: zod_1.z.string().min(20).max(200),
    durationDays: zod_1.z.number().optional(),
    type: zod_1.z.enum(enums_1.TourType),
    capacityMode: zod_1.z.enum(enums_1.CapacityMode),
    location: zod_1.z.string(),
    imageIds: zod_1.z.string().array(),
    itinerary: itinerary_validator_1.daysSchema,
    pricing: pricing_validator_1.createTourPricingSchema.array(),
    joinerCapacity: zod_1.z.number().optional(),
    ownerId: zod_1.z.string(),
    hasSchedule: zod_1.z.boolean().optional(),
    inclusions: exports.inclusionSchema.array(),
    exclusions: exports.exclusionSchema.array(),
    schedules: scheduleSchema.array(),
});
exports.updatePartialTourSchema = zod_1.z
    .object({
    name: zod_1.z.string().min(2).max(120),
    description: zod_1.z.string().min(20).max(200),
    durationDays: zod_1.z.number().optional(),
    type: zod_1.z.enum(enums_1.TourType),
    capacityMode: zod_1.z.enum(enums_1.CapacityMode),
    location: zod_1.z.string(),
    schedules: scheduleSchema.array(),
})
    .partial();
// export const updatePartialTourSchema = createFullTourSchema.partial();
exports.tourParamsSchema = zod_1.z.object({
    page: zod_1.z.number().optional(),
    limit: zod_1.z.number().optional(),
    sort: zod_1.z.string().optional(),
    search: zod_1.z.string().optional(),
    capacityMode: zod_1.z.enum(enums_1.CapacityMode).optional(),
    type: zod_1.z.enum(enums_1.TourType).optional(),
    duration: zod_1.z.number().optional(),
});
exports.tourIdParams = zod_1.z.object({
    tourId: zod_1.z.string(),
});
