import z from 'zod';

export const blockDatesSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  reason: z.string().optional(),
});
