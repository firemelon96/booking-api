import { z } from 'zod';

const items = z.object({
  time: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  order: z.number().int().min(0),
});

export const days = z.object({
  dayNumber: z.number().int().min(1),
  title: z.string().optional(),
  items: items.array(),
});

export const createItinerarySchema = z.object({
  title: z.string().min(2),
  activities: z.string().array(),
  destinations: z.string().array(),
});

export const updateItinerarySchema = z.object({
  days: days.array(),
});

export type UpdateItineraryInput = z.infer<typeof updateItinerarySchema>;
