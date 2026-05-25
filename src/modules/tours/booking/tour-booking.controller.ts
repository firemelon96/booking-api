import { NextFunction, Request, Response } from 'express';
import { createTourBookingSchema } from './tour-booking-validator';
import { createTourBooking } from './tour-booking.service';
import { tourIdParams } from '../tour.validator';

export async function userCreateBooking(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    throw new Error('Unauthorized');
  }

  const params = tourIdParams.safeParse(req.params);

  if (!params.success) {
    throw new Error('Invalid params');
  }

  const payload = createTourBookingSchema.safeParse(req.body);

  if (!payload.success) {
    throw new Error('Invalid fields');
  }

  try {
    const booking = await createTourBooking(
      params.data.tourId,
      req.user.userId,
      req.user.role,
      payload.data,
    );

    res.status(201).json(booking);
  } catch (error) {
    next(error);
  }
}
