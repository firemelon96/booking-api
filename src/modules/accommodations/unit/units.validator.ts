import z from 'zod';

export const createUnitSchema = z.object({
  accommodationId: z.uuid(),
  name: z.string().min(2),
  description: z.string().optional(),
  maxAdult: z.number().int(),
  maxChildren: z.number().int().optional(),
  bedrooms: z.number().int().optional(),
  bathrooms: z.number().int().optional(),
  quantity: z.number().int().min(1),

  basePrice: z.number().positive(),
  amenityIds: z.string().array().optional(),
});

export const unitQuerySchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional(),
  sort: z.string().optional(),
  search: z.string().optional(),
  accommodationId: z.string(),
});
