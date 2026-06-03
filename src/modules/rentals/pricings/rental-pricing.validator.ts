import z from 'zod';
import { RentalPricingType } from '../../../generated/prisma/enums';

export const createRentalPricingBodySchema = z.object({
  price: z.number(),
  pricingType: z.enum(RentalPricingType),
});

export const updateRentalPricingBodySchema =
  createRentalPricingBodySchema.partial();

export const rentalPricingIdParamsSchema = z.object({
  rentalItemId: z.string(),
  pricingId: z.string(),
});
