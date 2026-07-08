import z from 'zod';
import {
  createRentalBodySchema,
  rentalQuerySchema,
  updateRentalBodySchema,
} from './rental.validator';

export type CreateRentalBody = z.infer<typeof createRentalBodySchema>;

export type UpdateRentalBody = z.infer<typeof updateRentalBodySchema>;

export type RentalQuery = z.infer<typeof rentalQuerySchema>;
