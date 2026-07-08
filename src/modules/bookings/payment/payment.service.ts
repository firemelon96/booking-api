import { prisma } from '../../../config/prisma';
import xendit from '../../../config/xendit';
import { Prisma } from '../../../generated/prisma/client';
import { PaymentStatus } from '../../../generated/prisma/enums';
import { createXenditInvoice } from '../../webhooks/xendit/xendit.service';
import { findBookingOrThrow } from '../booking.query';
import { PaymentAccommodationType, PaymentInputType } from './payment.type';

export async function createPaymentIntent({
  bookingId,
  userId,
}: PaymentInputType) {
  const booking = await findBookingOrThrow({ bookingId, role: 'USER', userId });

  if (!booking) {
    throw new Error('Booking not found');
  }

  if (
    booking.bookingStatus === 'EXPIRED' ||
    booking.bookingStatus === 'CANCELLED'
  ) {
    throw new Error('Cannot book expired or cancelled');
  }

  const invoice = await createXenditInvoice({
    bookingId,
    amount: Number(booking.totalPrice),
    externalId: `created-${bookingId}-${Date.now()}`,
    type: 'CREATED',
  });

  return prisma.paymentTransation.create({
    data: {
      bookingId,
      type: 'INITIAL_PAYMENT',
      amount: invoice.amount,
      paymentStatus: 'PENDING',
      xenditInvoiceId: invoice.id,
      invoiceUrl: invoice.invoiceUrl,
      expiresAt: invoice.expiryDate,
    },
  });
}
