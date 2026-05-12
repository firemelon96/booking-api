import z, { TypeOf } from 'zod';
import { createAmenitySchema } from './amenity.validator';

export type CreateAmenityInputType = z.infer<typeof createAmenitySchema>;
