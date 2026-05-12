import { NextFunction, Request, Response } from 'express';
import {
  createAccommodationPaymentIntent,
  createPaymentIntent,
} from './payment.service';
import { createPaymentSchema } from './payment.validator';
import { createAccommodationBookingSchema } from '../../accommodations/booking/accommodation-booking.validator';

export async function createPayment(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    throw new Error('Unauthorized');
  }

  const input = {
    bookingId: req.params.bookingId,
    userId: req.user.userId,
  };

  const payload = createPaymentSchema.safeParse(input);

  if (!payload.success) {
    throw new Error('Invalide fields');
  }

  try {
    const payment = await createPaymentIntent(payload.data);

    return res.json({ invoiceUrl: payment.invoiceUrl });
  } catch (error) {
    next(error);
  }
}

export async function createAccommodationPayment(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    throw new Error('Unauthorized');
  }

  const input = {
    accommodationId: req.params.accommodationId,
    userId: req.user.userId,
  };

  const payload = createPaymentSchema.safeParse(input);

  if (!payload.success) {
    throw new Error('Invalide fields');
  }

  try {
    const payment = await createAccommodationPaymentIntent(payload.data);

    return res.json({ invoiceUrl: payment.invoiceUrl });
  } catch (error) {
    next(error);
  }
}
