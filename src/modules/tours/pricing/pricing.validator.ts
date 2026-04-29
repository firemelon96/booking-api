import { z } from 'zod';
import { PricingModel, PricingType } from '../../../generated/prisma/enums';

export const createTourPricingSchema = z
  .object({
    pricingType: z.enum(PricingType),
    minGroupSize: z.number().int().min(1),
    maxGroupSize: z.number().int().min(1),
    price: z.number().int().min(0),
    pricingModel: z.enum(PricingModel),
  })
  .refine((d) => d.minGroupSize <= d.maxGroupSize, {
    message: 'Min group size must be less than or equals max group size',
    path: ['minGroupSize'],
  });

export const createPricingArraySchema = z.array(createTourPricingSchema);
