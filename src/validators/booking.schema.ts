import { z } from 'zod';

export const createBookingSchema = z
  .object({
    tourId: z.uuid(),
    pricingType: z.enum(['JOINER', 'PRIVATE']),
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
  )
  .refine(
    (d) => {
      if (d.pricingType === 'JOINER') return !d.endDate;
      return true;
    },
    {
      message: 'Joiner bookings must be single-day (no end date).',
      path: ['endDate'],
    },
  );
