import { prisma } from '../../../config/prisma';
import xendit from '../../../config/xendit';
import { PaymentAccommodationType, PaymentInputType } from './payment.type';

export async function createPaymentIntent({
  bookingId,
  userId,
}: PaymentInputType) {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, userId },
    include: { tour: true },
  });

  if (!booking) {
    throw new Error('Booking not found');
  }

  if (booking.status === 'EXPIRED') {
    throw new Error('Booking is expired');
  }

  if (booking.status === 'CONFIRMED') {
    throw new Error('Already paid');
  }

  const invoice = await xendit.Invoice.createInvoice({
    data: {
      externalId: booking.id,
      amount: booking.totalPrice ?? 0,
      description: `Payment for booking ${booking.id} - ${booking.tour.name}`,
      invoiceDuration: 3600, // 1 hour,
      currency: 'PHP',
      successRedirectUrl: `${process.env.FRONTEND_URL}/payment-success?bookingId=${booking.id}`,
      failureRedirectUrl: `${process.env.FRONTEND_URL}/payment-failure?bookingId=${booking.id}`,
    },
  });

  if (!invoice.id || !invoice.invoiceUrl) {
    throw new Error('Failed to create payment invoice');
  }

  return prisma.payment.create({
    data: {
      bookingId: booking.id,
      xenditInvoiceId: invoice.id,
      invoiceUrl: invoice.invoiceUrl,
    },
  });
}

export async function createAccommodationPaymentIntent({
  bookingId,
  userId,
}: PaymentAccommodationType) {
  const booking = await prisma.accommodationBooking.findUnique({
    where: { id: bookingId, userId },
    include: { unit: true, accommodation: true },
  });

  if (!booking) {
    throw new Error('Booking not found.');
  }

  if (booking.paymentStatus === 'EXPIRED') {
    throw new Error('Booking is expired');
  }

  const invoice = await xendit.Invoice.createInvoice({
    data: {
      externalId: booking.id,
      amount: Number(booking.totalPrice),
      description: `Payment for accommodation booking ${booking.id} - ${booking.unitId ? booking.unit?.name : booking.accommodation.name}`,
      invoiceDuration: 3600, // 1 hour,
      currency: 'PHP',
      successRedirectUrl: `${process.env.FRONTEND_URL}/payment-success?bookingId=${booking.id}`,
      failureRedirectUrl: `${process.env.FRONTEND_URL}/payment-failure?bookingId=${booking.id}`,
    },
  });

  if (!invoice.id || !invoice.invoiceUrl) {
    throw new Error('Failed to create payment invoice');
  }

  return prisma.payment.create({
    data: {
      bookingId: booking.id,
      xenditInvoiceId: invoice.id,
      invoiceUrl: invoice.invoiceUrl,
    },
  });
}
