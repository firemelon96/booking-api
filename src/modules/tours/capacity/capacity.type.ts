import z from 'zod';
import {
  bulkOverrideCapacitySchema,
  overrideCapacitySchema,
} from './capacity.validator';
import { prepareCapacity } from './capacity.query';

export type CapacityParams = z.infer<typeof overrideCapacitySchema>;

export type BulkCapacityParams = z.infer<typeof bulkOverrideCapacitySchema>;

export type CapacityCtx = Awaited<ReturnType<typeof prepareCapacity>>;
