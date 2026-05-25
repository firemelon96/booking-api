import z from 'zod';

export const slugParams = z.object({
  slug: z.string(),
});

export const calendarQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  accommodationId: z.uuid(),
  unitId: z.uuid().optional(),
});
