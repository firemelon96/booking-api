import z from 'zod';

export const setInventorySchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  inventory: z.number(),
  scheduleId: z.string().optional(),
});
