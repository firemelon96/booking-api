import z from 'zod';
import { createRentalPricingBodySchema } from '../pricings/rental-pricing.validator';

export const rentalItemsSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  itemCode: z.string(),
  quantity: z.number().optional(),
  pricing: z.array(createRentalPricingBodySchema),
});

export const rentalItemIdParamsSchema = z.object({
  rentalId: z.string(),
  itemId: z.string(),
});
