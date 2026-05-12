import { Request, Response, NextFunction } from 'express';
import { createAccommodationBookingSchema } from './accommodation-booking.validator';
import { createBookingService } from './accommodation-booking.service';

export async function createBookingController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    throw new Error('Unauthorized');
  }

  const { accommodationId } = req.params;
  const { userId } = req.user;

  if (Array.isArray(accommodationId)) {
    throw new Error('Invalid params');
  }

  const input = {
    accommodationId,
    userId,
    ...req.body,
  };

  const payload = createAccommodationBookingSchema.safeParse(input);

  if (!payload.success) {
    throw new Error('Invalid fields');
  }

  try {
    const createBooking = await createBookingService(payload.data);

    res.json(createBooking);
  } catch (error) {
    next(error);
  }
}
