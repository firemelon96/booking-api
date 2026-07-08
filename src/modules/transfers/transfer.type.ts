import z from 'zod';
import {
  createTransferSchema,
  transferFilterSchema,
  transferQuerySchema,
  updateBaseTransferSchema,
} from './transfer.validator';

export type CreateTransferInput = z.infer<typeof createTransferSchema>;

export type UpdateBaseTransferInput = z.infer<typeof updateBaseTransferSchema>;

export type TransferQueryInput = z.infer<typeof transferQuerySchema>;

export type TransferFilterInput = z.infer<typeof transferFilterSchema>;
