import z from 'zod';
import { cancellationPolicySchema } from './cancellation.validator';

export type CancellationPolicyInput = z.infer<typeof cancellationPolicySchema>;
