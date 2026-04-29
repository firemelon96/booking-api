import z from 'zod';
import {
  createFullTourSchema,
  tourParamsSchema,
  updatePartialTourSchema,
} from './tour.validator';

export type TourType = z.infer<typeof createFullTourSchema>;
export type UpdateTourType = z.infer<typeof updatePartialTourSchema>;
export type TourParams = z.infer<typeof tourParamsSchema>;
