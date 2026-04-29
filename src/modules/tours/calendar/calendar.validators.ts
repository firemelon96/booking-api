import { z } from 'zod';

export const calendarQuery = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  scheduleId: z.string().optional(),
});
