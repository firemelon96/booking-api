import { z } from 'zod';

export const calculatePricingSchema = z.object({
  tourId: z.uuid(),
  pricingType: z.enum(['JOINER', 'PRIVATE']),
  participants: z.number().int().min(1).max(100),
});
