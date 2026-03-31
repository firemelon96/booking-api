import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import xendit from '../config/xendit';

export async function createPayment(req: Request, res: Response) {
  try {
    const { bookingId } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { tour: true },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const invoice = await xendit.Invoice.createInvoice({
      data: {
        externalId: booking.id,
        amount: booking.totalPrice,
        description: `Payment for booking ${booking.id} - ${booking.tour.name}`,
        invoiceDuration: 3600, // 1 hour,
        currency: 'PHP',
        successRedirectUrl: `${process.env.FRONTEND_URL}/payment-success?bookingId=${booking.id}`,
        failureRedirectUrl: `${process.env.FRONTEND_URL}/payment-failure?bookingId=${booking.id}`,
      },
    });

    if (!invoice.id || !invoice.invoiceUrl) {
      return res
        .status(500)
        .json({ error: 'Failed to create payment invoice' });
    }

    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        xenditInvoiceId: invoice.id,
        invoiceUrl: invoice.invoiceUrl,
      },
    });

    return res.json({ invoiceUrl: invoice.invoiceUrl });
  } catch (err) {
    console.error('Error creating payment intent:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
