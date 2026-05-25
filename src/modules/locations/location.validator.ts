import z from 'zod';

export const addLocationSchema = z.object({
  name: z.string(),
  type: z.enum(['AIRPORT', 'PORT', 'TERMINAL']),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const locationIdParams = z.object({
  locationId: z.uuid(),
});

export const updateLocationSchema = addLocationSchema.optional();

export const locationQuerySchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional(),
  sort: z.string().optional(),
  search: z.string().optional(),
  type: z.enum(['AIRPORT', 'PORT', 'TERMINAL', 'HOTEL', 'CUSTOM']).optional(),
});
