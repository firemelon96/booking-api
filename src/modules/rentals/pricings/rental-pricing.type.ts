import { create, update } from 'lodash';
import z from 'zod';
import {
  createRentalPricingBodySchema,
  updateRentalPricingBodySchema,
} from './rental-pricing.validator';

export type UpdateRentalPricingData = z.infer<
  typeof updateRentalPricingBodySchema
>;

export type CreateRentalPricingData = z.infer<
  typeof createRentalPricingBodySchema
>;
