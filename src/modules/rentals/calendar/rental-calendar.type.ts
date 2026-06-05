import z from 'zod';
import { rentalCalendarSchema } from './rental-calendar.validator';

export type RentalCalendarInput = z.infer<typeof rentalCalendarSchema>;
