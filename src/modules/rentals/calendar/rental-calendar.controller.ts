import { NextFunction, Request, Response } from 'express';
import { rentalCalendarSchema } from './rental-calendar.validator';
import { rentalItemAvailabilityService } from './rental-calendar.service';

export async function rentalItemCalendarAvailability(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const payload = rentalCalendarSchema.safeParse(req.body);

  if (!payload.success) {
    throw new Error('Invalid query params');
  }

  try {
    const availability = await rentalItemAvailabilityService(payload.data);

    res.json(availability);
  } catch (error) {
    next(error);
  }
}
