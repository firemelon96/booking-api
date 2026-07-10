import { Types } from '@prisma/client/runtime/client';
import z from 'zod';
import { TransactionType } from '../../../generated/prisma/enums';

export const createPaymentSchema = z.object({
  bookingId: z.string(),
  userId: z.string(),
});

export const createAccommodationSchema = z.object({
  accommodationId: z.string(),
  userId: z.string(),
  unitId: z.string().optional(),
});

export const createInitialPaymentTransaction = z.object({
  bookingId: z.string(),
  type: z.enum(TransactionType),
  amount: z.number(),
  xenditInvoiceId: z.string().optional(),
  invoiceUrl: z.string().optional(),
  expiresAt: z.date().optional(),
  description: z.string().optional(),
});
