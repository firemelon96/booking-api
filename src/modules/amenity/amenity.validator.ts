import z from 'zod';

export const createAmenitySchema = z.object({
  name: z.string().min(1),
  icon: z.string().optional().nullable(),
});

export const updateAmenitySchema = createAmenitySchema.partial();
