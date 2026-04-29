import { z } from 'zod';
import { createTourPricingSchema } from './pricing.validator';

export type PricingType = z.infer<typeof createTourPricingSchema>;
