import { z } from 'zod';

export const calculatePricingSchema = z.object({
  tourId: z.uuid(),
  pricingType: z.enum(['joiner', 'private']),
  participants: z.number().int().min(1).max(100),
});
