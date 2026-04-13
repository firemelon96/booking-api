import { z } from 'zod';
import { createTourSchema } from './tour.schema';
import { PricingType } from '../generated/prisma/enums';

export const availabilityQuerySchema = z.object({
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'start must be YYYY-MM-DD'),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'end must be YYYY-MM-DD'),
  pricingType: z.enum(['JOINER', 'PRIVATE']).optional(),
});

export const reserveSchema = z.object({
  tour: createTourSchema,
  pricingType: z.enum(PricingType),
  participants: z.number(),
  interval: z.object({
    start: z.date(),
    end: z.date(),
  }),
  scheduleId: z.string().optional(),
  excludeBookingId: z.string().optional(),
});

export const availabilityQuerySchema2 = z.object({
  tourId: z.string(),
  month: z.string(),
  scheduleId: z.string().optional(),
});
