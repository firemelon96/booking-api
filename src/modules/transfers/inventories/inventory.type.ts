import z from 'zod';
import { setInventorySchema } from './inventory.validator';

export type SetInventoryInput = z.infer<typeof setInventorySchema>;
