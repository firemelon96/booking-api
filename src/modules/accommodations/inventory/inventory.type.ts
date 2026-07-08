import z from 'zod';
import { closeInventorySchema } from './inventory.validator';

export type CloseInventoryInput = z.infer<typeof closeInventorySchema>;
