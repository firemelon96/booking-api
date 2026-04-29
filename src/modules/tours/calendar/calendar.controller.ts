import { Request, Response, NextFunction } from 'express';
import { calendarQuery } from './calendar.validators';
import { calendarAvailability } from './calendar.service';

export async function getCalendarAvailability(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { slug } = req.params;

  const payload = calendarQuery.safeParse(req.query);

  if (Array.isArray(slug) || !slug) {
    return res.status(400).json({ error: 'Invalid tour slug' });
  }

  if (!payload.success) {
    return res.status(400).json({ error: 'Invalid query parameters' });
  }

  try {
    const results = calendarAvailability({
      slug,
      ...payload.data,
    });

    return res.json(results);
  } catch (error) {
    next(error);
  }
}
