import { Request, Response, NextFunction } from 'express';
import {
  accommodationIdParams,
  createAccommodationBookingSchema,
} from './accommodation-booking.validator';
import { createAccommodationBookingService } from './accommodation-booking.service';
import { userIdSchema } from '../../users/user.validation';

export async function adminCreateAccommodationBooking(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { accommodationId, ...rest } = req.body;

  if (!req.user) {
    throw new Error('Unauthorized');
  }

  const userId = userIdSchema.safeParse(req.user.userId);

  if (!accommodationId) {
    throw new Error('Invalid accommodation provided');
  }

  if (!userId.success) {
    throw new Error('Unauthorized');
  }

  const payload = createAccommodationBookingSchema.safeParse(rest);

  if (!payload.success) {
    throw new Error('Invalid fields');
  }

  try {
    const createBooking = await createAccommodationBookingService(
      accommodationId,
      userId.data.userId,
      req.user.role,
      payload.data,
    );

    res.json(createBooking);
  } catch (error) {
    next(error);
  }
}

export async function createBookingController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    throw new Error('Unauthorized');
  }

  const userId = userIdSchema.safeParse(req.user);
  const accommodationId = accommodationIdParams.safeParse(req.params);

  if (!accommodationId.success) {
    throw new Error('Invalid accommodation');
  }

  if (!userId.success) {
    throw new Error('Unauthorized userid');
  }

  const payload = createAccommodationBookingSchema.safeParse(req.body);

  if (!payload.success) {
    throw new Error('Invalid fields');
  }

  try {
    const createBooking = await createAccommodationBookingService(
      accommodationId.data.accommodationId,
      userId.data.userId,
      req.user.role,
      payload.data,
    );

    res.json(createBooking);
  } catch (error) {
    next(error);
  }
}
