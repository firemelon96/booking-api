import z from 'zod';
import { createTransferBookingSchema } from './booking.validator';

export type TransferBookingInput = z.infer<typeof createTransferBookingSchema>;
