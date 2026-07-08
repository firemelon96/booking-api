import z from 'zod';
import { transferScheduleSchema } from './schedule.validator';

export type TransferScheduleInput = z.infer<typeof transferScheduleSchema>;
