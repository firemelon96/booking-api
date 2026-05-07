import z from 'zod';
import { createPaymentSchema } from './payment.validator';

export type PaymentInputType = z.infer<typeof createPaymentSchema>;
