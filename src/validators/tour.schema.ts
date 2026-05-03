import z from 'zod';
import { imageSchema } from './image.schema';
// import { createItinerarySchema, days } from './itinerary.schema';
// import { createTourPricingSchema } from './tourPricing.schema';
import { CapacityMode, TourType } from '../generated/prisma/enums';

export const createTourSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z
    .string()
    .min(2)
    .max(140)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be kebab-case')
    .optional(),
  imageIds: z.string().array(),
});

export const updateTourSchema = z
  .object({
    name: z.string().min(2).max(120),
    description: z.string().min(20).max(200),
    location: z.string(),
    inclusions: z.string().array(),
    exclusions: z.string().array(),
    durationDays: z.number().optional(),
    capacityMode: z.enum(CapacityMode),
    // type: z.enum(TourType),
    // itinerary: days.array(),
    // pricing: createTourPricingSchema.array(),
  })
  .partial();

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
  // itinerary: days.array(),
  // pricing: createTourPricingSchema.array(),
});

export type CreateTourType = z.infer<typeof createFullTourSchema>;
export type UpdateTourType = z.infer<typeof updateTourSchema>;
