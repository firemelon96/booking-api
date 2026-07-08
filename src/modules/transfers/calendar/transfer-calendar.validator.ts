import z from 'zod';

export const transferCalendarQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  scheduleId: z.string().optional(),
});
