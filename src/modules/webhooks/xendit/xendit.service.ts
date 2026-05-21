import { success } from 'zod';
import { prisma } from '../../../config/prisma';
import xendit from '../../../config/xendit';
import {
  BookingAction,
  BookingStatus,
  PaymentStatus,
} from '../../../generated/prisma/enums';
import { logBookingAction } from '../../bookings/audit/booking-audit.service';
import { updateBookingPaymentSummary } from '../../bookings/booking.query';

export async function xenditPayment(
  signature: string,
  xenditInvoiceId: string,
  invoiceStatus: string,
) {
  if (signature !== process.env.XENDIT_WEBHOOK_SECRET) {
    throw new Error('Unauthorized webhhook');
  }

  const transaction = await prisma.paymentTransation.findFirst({
    where: { xenditInvoiceId },
    include: { booking: true },
  });

  if (!transaction) {
    throw new Error('Payment transaction not found');
  }

  if (transaction.paymentStatus === 'PAID' && invoiceStatus === 'PAID') {
    return {
      success: true,
      message: 'Webhook already processed',
    };
  }

  let paymentStatus: PaymentStatus = 'PENDING';

  switch (invoiceStatus) {
    case 'PAID':
      paymentStatus = 'PAID';
      break;

    case 'EXPIRED':
      paymentStatus = 'EXPIRED';
      break;

    case 'FAILED':
      paymentStatus = 'FAILED';
      break;

    default:
      paymentStatus = 'PENDING';
  }

  return prisma.$transaction(async (tx) => {
    const updatedTransaction = await tx.paymentTransation.update({
      where: {
        id: transaction.id,
      },
      data: {
        paymentStatus,
        ...(paymentStatus === 'PAID' ? { paidAt: new Date() } : {}),
      },
    });

    const updatedBooking = await updateBookingPaymentSummary(
      tx,
      transaction.bookingId,
    );

    let bookingStatus = updatedBooking.bookingStatus;

    if (transaction.type === 'INITIAL_PAYMENT' && paymentStatus === 'PAID') {
      bookingStatus = 'CONFIRMED';
    }

    if (transaction.type === 'ADDITIONAL_PAYMENT' && paymentStatus === 'PAID') {
      if (Number(updatedBooking.remainingBalance) <= 0) {
        bookingStatus = 'CONFIRMED';
      }
    }

    if (
      transaction.type === 'INITIAL_PAYMENT' &&
      ['FAILED', 'EXPIRED'].includes(paymentStatus)
    ) {
      bookingStatus = 'CANCELLED';
    }

    const finalBooking = await tx.booking.update({
      where: { id: transaction.bookingId },
      data: {
        bookingStatus,
      },
    });

    // PAYMENT_WEBHOOK_UPDATED enum,
    await logBookingAction({
      tx,
      action: 'PAYMENT_WEBHOOK_UPDATED',
      role: 'ADMIN',
      newValue: {
        transactionId: transaction.id,
        transactionType: transaction.type,
        xenditInvoiceId,
        invoiceStatus,
        paymentStatus,
        bookingStatus,
      },
    });

    return {
      success: true,
      booking: finalBooking,
      transaction: updatedTransaction,
    };
  });
}

export async function createXenditInvoice({
  bookingId,
  amount,
  type,
  externalId,
}: {
  bookingId: string;
  amount: number;
  type: BookingAction;
  externalId: string;
}) {
  const invoice = await xendit.Invoice.createInvoice({
    data: {
      externalId,
      amount: amount,
      description: `Payment for booking ${type}: ${bookingId}`,
      invoiceDuration: 3600, // 1 hour,
      currency: 'PHP',
      successRedirectUrl: `${process.env.FRONTEND_URL}/payment-success?bookingId=${bookingId}`,
      failureRedirectUrl: `${process.env.FRONTEND_URL}/payment-failure?bookingId=${bookingId}`,
    },
  });

  if (!invoice) {
    throw new Error('Failed to create invoice');
  }

  return invoice;
}
