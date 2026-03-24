import { z } from 'zod';

export const createItinerarySchema = z.object({
  title: z.string().min(10),
  activities: z.string().array(),
  destinations: z.string().array(),
});
