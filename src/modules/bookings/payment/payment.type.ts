import z from 'zod';
import {
  createInitialPaymentTransaction,
  createPaymentSchema,
} from './payment.validator';
import { createAccommodationBookingSchema } from '../../accommodations/booking/accommodation-booking.validator';
import {
  PaymentStatus,
  PaymentTransation,
  Prisma,
  TransactionType,
} from '../../../generated/prisma/client';

export type PaymentInputType = z.infer<typeof createPaymentSchema>;

export type PaymentAccommodationType = z.infer<typeof createPaymentSchema>;

export type CreatePaymentTransationParams = {
  tx: Prisma.TransactionClient;
  bookingId: string;
  type: TransactionType;
  amount: Prisma.Decimal | number;
  paymentStatus?: PaymentStatus;
  xenditInvoiceId?: string;
  invoiceUrl?: string;
  description?: string;
  expiresAt?: Date;
  metadata?: Prisma.JsonObject;
};

export type CreateInitialPaymentTransaction = z.infer<
  typeof createInitialPaymentTransaction
>;
