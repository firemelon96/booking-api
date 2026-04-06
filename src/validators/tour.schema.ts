import z from 'zod';
import { imageSchema } from './image.schema';
import { createItinerarySchema } from './itinerary.schema';
import { createTourPricingSchema } from './tourPricing.schema';

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

export const updateTourSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z
    .string()
    .min(2)
    .max(140)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be kebab-case')
    .optional(),
  description: z.string().min(20).max(200),
  location: z.string(),
  inclusions: z.string().array(),
  exclusions: z.string().array(),
});

export const createFullTourSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z
    .string()
    .min(2)
    .max(140)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be kebab-case')
    .optional(),
  description: z.string().min(20).max(200),
  location: z.string(),
  inclusions: z.string().array(),
  exclusions: z.string().array(),
  imageIds: z.string().array(),
  itineraries: createItinerarySchema.array(),
  pricing: createTourPricingSchema.array(),
});
