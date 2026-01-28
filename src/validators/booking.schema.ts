import { z } from 'zod';

export const createBookingSchema = z
  .object({
    tourId: z.uuid(),
    pricingType: z.enum(['joiner', 'private']),
    participants: z.number().int().min(1).max(100),
    startDate: z.iso.datetime(),
    endDate: z.iso.datetime().optional(),
  })
  .refine(
    (d) => {
      if (!d.endDate) return true;
      return new Date(d.endDate).getTime() >= new Date(d.startDate).getTime();
    },
    {
      message: 'End date must be Greater than the start date',
      path: ['endDate'],
    },
  );
