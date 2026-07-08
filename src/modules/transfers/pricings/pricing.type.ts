import z from 'zod';
import { transferPricingSchema } from './pricing.validator';

export type TransferPricingInput = z.infer<typeof transferPricingSchema>;
