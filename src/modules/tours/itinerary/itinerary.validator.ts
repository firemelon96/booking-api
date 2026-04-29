import { z } from 'zod';

const items = z.object({
  time: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  order: z.number().int().min(0),
});

export const daysSchema = z
  .object({
    dayNumber: z.number().int().min(1),
    title: z.string().optional(),
    items: items.array(),
  })
  .array();
