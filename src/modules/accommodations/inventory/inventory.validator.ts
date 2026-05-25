import z from 'zod';

export const closeInventorySchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  unitId: z.string().optional(),
});
