import z from 'zod';

export const rentalCalendarSchema = z.object({
  itemId: z.uuid(),
  month: z.string().regex(/^\d{4}-\d{2}$/),
});
