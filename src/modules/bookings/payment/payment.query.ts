import { prisma } from '../../../config/prisma';
import { PaymentStatus, Prisma } from '../../../generated/prisma/client';
import { createXenditInvoice } from '../../webhooks/xendit/xendit.service';
import { findBookingOrThrow } from '../booking.query';
import {
  CreateInitialPaymentTransaction,
  CreatePaymentTransationParams,
} from './payment.type';

export async function createPaymentTransaction({
  tx,
  bookingId,
  type,
  amount,
  paymentStatus = 'PENDING',
  xenditInvoiceId,
  invoiceUrl,
  description,
  expiresAt,
  metadata,
}: CreatePaymentTransationParams) {
  return tx.paymentTransation.create({
    data: {
      bookingId,
      type,
      amount,
      paymentStatus,
      xenditInvoiceId,
      invoiceUrl,
      description,
      expiresAt,
      metadata,
    },
  });
}

export async function createInitialBookingPayment(
  tx: Prisma.TransactionClient,
  {
    amount,
    bookingId,
    type,
    description,
    expiresAt,
  }: CreateInitialPaymentTransaction,
) {
  const invoice = await createXenditInvoice({
    bookingId,
    amount,
    type: 'CREATED',
    externalId: `booking-${bookingId}`,
  });

  return createPaymentTransaction({
    tx,
    bookingId,
    type,
    amount,
    xenditInvoiceId: invoice.id,
    invoiceUrl: invoice.invoiceUrl,
    expiresAt,
    description,
  });
}

export async function updateBookingPaymentSummary(
  tx: Prisma.TransactionClient,
  bookingId: string,
) {
  const booking = await findBookingOrThrow({ bookingId });

  const transactions = await tx.paymentTransation.findMany({
    where: {
      bookingId,
      paymentStatus: {
        in: ['PAID', 'PARTIALLY_REFUNDED'],
      },
    },
  });

  let paidAmount = 0;

  for (const transaction of transactions) {
    switch (transaction.type) {
      case 'INITIAL_PAYMENT':
      case 'ADDITIONAL_PAYMENT':
      case 'MANUAL_ADJUSTMENT':
        paidAmount += Number(transaction.amount);
        break;

      case 'REFUND':
        paidAmount -= Number(transaction.amount);
        break;
    }
  }

  const remainingBalance = Number(booking.totalPrice) - paidAmount;

  let paymentStatus: PaymentStatus = 'PENDING';

  if (paidAmount <= 0) {
    paymentStatus = 'PENDING';
  } else if (remainingBalance > 0) {
    paymentStatus = 'PENDING';
  } else {
    paymentStatus = 'PAID';
  }

  return tx.booking.update({
    where: {
      id: bookingId,
    },
    data: {
      paidAmount,
      remainingBalance,
      paymentStatus,
    },
  });
}

export async function createRescheduleAdjustmentPayment({
  tx,
  bookingId,
  amount,
  customer,
}: {
  tx: Prisma.TransactionClient;
  bookingId: string;
  amount: number;
  customer: any;
}) {
  if (amount <= 0) {
    return null;
  }

  const invoice = await createXenditInvoice({
    bookingId,
    amount,
    externalId: `reschedule-${bookingId}-${Date.now()}`,
    type: 'RESCHEDULED',
  });

  return tx.paymentTransation.create({
    data: {
      bookingId,
      type: 'ADDITIONAL_PAYMENT',
      amount,
      xenditInvoiceId: invoice.id,
      invoiceUrl: invoice.invoiceUrl,
      description: 'Reschedule payment adjustment',
      metadata: {
        reason: 'BOOKING_RESCHEDULE',
      },
    },
  });
}

export async function handleXenditInvoicePayment(xenditInvoiceId: string) {
  return prisma.$transaction(async (tx) => {
    const transaction = await tx.paymentTransation.findFirst({
      where: {
        xenditInvoiceId,
      },
      include: {
        booking: true,
      },
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.paymentStatus === 'PAID') {
      return transaction;
    }

    await tx.paymentTransation.update({
      where: {
        id: transaction.id,
      },
      data: {
        paymentStatus: 'PAID',
        paidAt: new Date(),
      },
    });

    await updateBookingPaymentSummary(tx, transaction.bookingId);

    return transaction;
  });
}
