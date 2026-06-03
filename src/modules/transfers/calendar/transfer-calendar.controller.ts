import { NextFunction, Request, Response } from 'express';
import { transferCalendarQuerySchema } from './transfer-calendar.validator';
import { getTransferCalendarService } from './transfer-calendar.service';
import { transferSlugParams } from '../transfer.validator';

export async function getTransferCalendarController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const slug = transferSlugParams.safeParse(req.params);

  if (!slug.success) {
    return res.status(400).json({ error: 'Invalid transfer slug' });
  }

  const payload = transferCalendarQuerySchema.safeParse(req.query);

  if (!payload.success) {
    return res.status(400).json({ error: 'Invalid query parameters' });
  }

  try {
    const availability = await getTransferCalendarService(payload.data);
    return res.json(availability);
  } catch (error) {
    next(error);
  }
}
