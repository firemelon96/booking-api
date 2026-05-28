import z from 'zod';
import { PricingType } from '../../../generated/prisma/enums';

export const transferPricingSchema = z.object({
  pricingType: z.enum(PricingType),
  price: z.number(),
  minPassengers: z.number(),
  maxPassengers: z.number(),
});
