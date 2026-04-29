import { z } from 'zod';
import { calendarQuery } from './calendar.validators';

export type CalendarQueryType = z.infer<typeof calendarQuery>;
