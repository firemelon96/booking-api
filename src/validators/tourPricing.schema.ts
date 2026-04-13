import { z } from 'zod';
import { PricingModel } from '../generated/prisma/enums';

const pricingTypeEnum = z.enum(['JOINER', 'PRIVATE']);

export const createTourPricingSchema = z
  .object({
    pricingType: pricingTypeEnum,
    minGroupSize: z.number().int().min(1),
    maxGroupSize: z.number().int().min(1),
    price: z.number().int().min(0),
    pricingModel: z.enum(PricingModel),
  })
  .refine((d) => d.minGroupSize <= d.maxGroupSize, {
    message: 'Min group size must be less than or equals max group size',
    path: ['minGroupSize'],
  });

export const updateTourPricingSchema = z
  .object({
    pricingType: pricingTypeEnum.optional(),
    minGroupSize: z.number().int().min(1).optional(),
    maxGroupSize: z.number().int().min(1).optional(),
    price: z.number().int().min(0).optional(),
    isGroupPrice: z.boolean().optional(),
  })
  .refine(
    (d) => {
      if (d.minGroupSize !== undefined && d.maxGroupSize !== undefined) {
        return d.minGroupSize <= d.maxGroupSize;
      }
      return true;
    },
    {
      message: 'minGroupSize must be <= maxGroupSize',
      path: ['minGroupSize'],
    },
  );
