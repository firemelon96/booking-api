import z from 'zod';

export const overrideCapacitySchema = z.object({
  date: z.coerce.date(),
  scheduleId: z.string().optional(),
  capacity: z.number().int().min(0),
});

export const bulkOverrideCapacitySchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  scheduleId: z.string().optional(),
  capacity: z.number().int().min(0),
});
