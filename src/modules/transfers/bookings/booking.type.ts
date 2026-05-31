import z from 'zod';
import {
  createTransferBookingSchema,
  rescheduleTransferBookingSchema,
} from './booking.validator';

export type TransferBookingInput = z.infer<typeof createTransferBookingSchema>;

export type RescheduleTransferBookingInput = z.infer<
  typeof rescheduleTransferBookingSchema
>;
