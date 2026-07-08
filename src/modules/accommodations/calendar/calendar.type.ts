import z from 'zod';
import { calendarQuerySchema } from './calendar.validator';

export type CalendarInput = z.infer<typeof calendarQuerySchema>;
