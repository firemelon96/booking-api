import z from 'zod';
import { createTransferSchema } from './transfer.validator';

export type CreateTransferInput = z.infer<typeof createTransferSchema>;
