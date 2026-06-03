import z from 'zod';
import { transferCalendarQuerySchema } from './transfer-calendar.validator';

export type TransferCalendarQuery = z.infer<typeof transferCalendarQuerySchema>;
