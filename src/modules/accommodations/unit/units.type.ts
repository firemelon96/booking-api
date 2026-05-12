import z from 'zod';
import { createUnitSchema, unitQuerySchema } from './units.validator';

export type CreateUnitInput = z.infer<typeof createUnitSchema>;

export type UnitQueryInput = z.infer<typeof unitQuerySchema>;
