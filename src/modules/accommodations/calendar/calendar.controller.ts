import { NextFunction, Request, Response } from 'express';
import { calendarQuerySchema, slugParams } from './calendar.validator';
import { calendarAccommodationService } from './calendar.service';

export async function getAccommodationCalendarController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { slug } = req.params;

  if (Array.isArray(slug)) {
    throw new Error('invalid params');
  }

  const payload = calendarQuerySchema.safeParse(req.query);

  if (!payload.success) {
    throw new Error('Invalid fields');
  }
  try {
    const results = await calendarAccommodationService(slug, payload.data);

    res.json(results);
  } catch (error) {
    next(error);
  }
}
