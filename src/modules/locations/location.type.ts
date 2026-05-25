import z from 'zod';
import {
  addLocationSchema,
  locationQuerySchema,
  updateLocationSchema,
} from './location.validator';

export type AddLocationInput = z.infer<typeof addLocationSchema>;

export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;

export type LocationQueryInput = z.infer<typeof locationQuerySchema>;
