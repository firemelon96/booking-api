import { z } from 'zod';
import { CapacityMode, TourType } from '../../generated/prisma/enums';
import { daysSchema } from './itinerary/itinerary.validator';
import { createTourPricingSchema } from './pricing/pricing.validator';

export const createFullTourSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().min(20).max(200),
  durationDays: z.number().optional(),
  type: z.enum(TourType),
  capacityMode: z.enum(CapacityMode),
  location: z.string(),
  inclusions: z.string().array(),
  exclusions: z.string().array(),
  imageIds: z.string().array(),
  itinerary: daysSchema,
  pricing: createTourPricingSchema.array(),
  joinerCapacity: z.number().optional(),
  ownerId: z.string(),
});

export const updatePartialTourSchema = z
  .object({
    name: z.string().min(2).max(120),
    description: z.string().min(20).max(200),
    durationDays: z.number().optional(),
    type: z.enum(TourType),
    capacityMode: z.enum(CapacityMode),
    location: z.string(),
    inclusions: z.string().array(),
    exclusions: z.string().array(),
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
  tourId: z.uuid(),
});
