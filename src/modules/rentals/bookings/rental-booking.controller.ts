import { NextFunction, Request, Response } from 'express';
import { rentalItemIdParamsSchema } from '../items/rental-item.validator';
import { createRentalBookingSchema } from './rental-booking.validator';
import { createRentalBookingService } from './rental-booking.service';

export async function adminCreateRentalBookingController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    throw new Error('Unauthorized');
  }

  const { rentalId, itemId, ...rentalData } = req.body;

  const params = rentalItemIdParamsSchema.safeParse({ rentalId, itemId });

  if (!params.success) {
    throw new Error('Rental or item id not found');
  }

  const payload = createRentalBookingSchema.safeParse(rentalData);

  if (!payload.success) {
    throw new Error('Invalid fields');
  }

  try {
    const createdBooking = await createRentalBookingService(
      req.user.userId,
      req.user.role,
      params.data,
      payload.data,
    );

    res.json(createdBooking);
  } catch (error) {
    next(error);
  }
}

export async function createRentalBookingController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    throw new Error('Unauthorized');
  }

  const params = rentalItemIdParamsSchema.safeParse(req.params);

  if (!params.success) {
    throw new Error('Invalid params');
  }

  const payload = createRentalBookingSchema.safeParse(req.body);

  if (!payload.success) {
    throw new Error('Invalid booking body');
  }
  try {
    const created = await createRentalBookingService(
      req.user.userId,
      req.user.role,
      params.data,
      payload.data,
    );

    res.json(created);
  } catch (error) {
    next(error);
  }
}
