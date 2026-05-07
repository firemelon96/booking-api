import { prisma } from '../../../config/prisma';
import { BookingStatus, PaymentStatus } from '../../../generated/prisma/enums';

export async function xenditPayment(
  signature: string,
  id: string,
  status: string,
) {
  if (signature !== process.env.XENDIT_WEBHOOK_SECRET) {
    throw new Error('Unauthorized to use the webhhook');
  }

  const payment = await prisma.payment.findFirst({
    where: { xenditInvoiceId: id },
  });

  if (!payment) {
    throw new Error('Payment not found');
  }

  let paymentStatus: PaymentStatus = 'PENDING';
  let bookingStatus: BookingStatus = 'PENDING';

  if (status === 'PAID') {
    paymentStatus = 'PAID';
    bookingStatus = 'CONFIRMED';
  }

  if (status === 'EXPIRED' || status === 'FAILED') {
    paymentStatus = status;
    bookingStatus = 'CANCELLED';
  }

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
}
