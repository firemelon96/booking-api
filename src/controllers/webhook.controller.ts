import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import {
  BookingStatus,
  Payment,
  PaymentStatus,
} from '../generated/prisma/browser';
import { PaymentScalarFieldEnum } from '../generated/prisma/internal/prismaNamespaceBrowser';

export async function xenditWebhook(req: Request, res: Response) {
  const body = req.body;

  const payment = await prisma.payment.findFirst({
    where: { xenditInvoiceId: body.id },
  });

  if (!payment) {
    return res.status(404).json({ error: 'Payment record not found' });
  }

  let paymentStatus: PaymentStatus = 'PENDING';
  let bookingStatus: BookingStatus = 'PENDING';

  if (body.status === 'PAID') {
    paymentStatus = 'PAID';
    bookingStatus = 'CONFIRMED';
  }

  if (body.status === 'EXPIRED' || body.status === 'CANCELLED') {
    paymentStatus = body.status;
    bookingStatus = 'CANCELLED';
  }
  try {
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: { status: paymentStatus },
      }),
      prisma.booking.update({
        where: { id: payment.bookingId },
        data: { status: bookingStatus },
      }),
    ]);

    return res.json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
