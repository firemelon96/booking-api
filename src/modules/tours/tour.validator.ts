import { z } from 'zod';
import { CapacityMode, TourType } from '../../generated/prisma/enums';
import { daysSchema } from './itinerary/itinerary.validator';
import { createTourPricingSchema } from './pricing/pricing.validator';

export const inclusionSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
});

export const exclusionSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
});

const scheduleSchema = z.object({
  label: z.string(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  maxParticipants: z.number().optional(),
});

export const createFullTourSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().min(20).max(200),
  durationDays: z.number().optional(),
  type: z.enum(TourType),
  capacityMode: z.enum(CapacityMode),
  location: z.string(),
  imageIds: z.string().array(),
  itinerary: daysSchema,
  pricing: createTourPricingSchema.array(),
  joinerCapacity: z.number().optional(),
  ownerId: z.string(),
  hasSchedule: z.boolean().optional(),
  inclusions: inclusionSchema.array(),
  exclusions: exclusionSchema.array(),
  schedules: scheduleSchema.array(),
});

export const updatePartialTourSchema = z
  .object({
    name: z.string().min(2).max(120),
    description: z.string().min(20).max(200),
    durationDays: z.number().optional(),
    type: z.enum(TourType),
    capacityMode: z.enum(CapacityMode),
    location: z.string(),
    schedules: scheduleSchema.array(),
  })
  .partial();

// export const updatePartialTourSchema = createFullTourSchema.partial();

export const tourParamsSchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional(),
  sort: z.string().optional(),
  search: z.string().optional(),
  capacityMode: z.enum(CapacityMode).optional(),
  type: z.enum(TourType).optional(),
  duration: z.number().optional(),
});

export const tourIdParams = z.object({
  tourId: z.string(),
});
