import z from 'zod';
import { createRentalBookingSchema } from './rental-booking.validator';

export type CreateRentalBooking = z.infer<typeof createRentalBookingSchema>;
