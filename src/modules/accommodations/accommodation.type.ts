import z from 'zod';
import {
  accommodationQuerySchema,
  createAccommodationSchema,
  updateAccommodationSchema,
} from './accommodation.validator';

export type CreateAccommodationInput = z.infer<
  typeof createAccommodationSchema
>;

export type AccommodationQueryInput = z.infer<typeof accommodationQuerySchema>;

export type UpdateAccommodationPartialInput = z.infer<
  typeof updateAccommodationSchema
>;
