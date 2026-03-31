import { z } from 'zod';

export const createItinerarySchema = z.object({
  title: z.string().min(2),
  activities: z.string().array(),
  destinations: z.string().array(),
});
