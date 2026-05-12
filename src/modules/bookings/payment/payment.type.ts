import z from 'zod';
import { createPaymentSchema } from './payment.validator';
import { createAccommodationBookingSchema } from '../../accommodations/booking/accommodation-booking.validator';

export type PaymentInputType = z.infer<typeof createPaymentSchema>;

export type PaymentAccommodationType = z.infer<typeof createPaymentSchema>;
