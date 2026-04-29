import z from 'zod';
import { blockDatesSchema } from './availability.validator';

export type BlockDatesParams = z.infer<typeof blockDatesSchema>;
