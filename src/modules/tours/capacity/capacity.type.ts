import z from 'zod';
import {
  bulkOverrideCapacitySchema,
  overrideCapacitySchema,
} from './capacity.validator';

export type CapacityParams = z.infer<typeof overrideCapacitySchema>;

export type BulkCapacityParams = z.infer<typeof bulkOverrideCapacitySchema>;
