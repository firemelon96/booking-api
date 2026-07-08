import { NextFunction, Request, Response } from 'express';
import { rentalCalendarSchema } from './rental-calendar.validator';
import { rentalItemAvailabilityService } from './rental-calendar.service';
import { rentalSlugParamsSchema } from '../rental.validator';

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
    const calendarAvailability = await rentalItemAvailabilityService(
      payload.data,
    );

    res.json(calendarAvailability);
  } catch (error) {
    next(error);
  }
}
