import { NextFunction, Request, Response } from 'express';
import { blockDatesSchema } from './availability.validator';
import { closeDates, openDates } from './availability.service';

export async function blockDates(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { tourId } = req.params;

  if (Array.isArray(tourId)) {
    return res.status(400).json({ error: 'Invalid tourId' });
  }

  const payload = blockDatesSchema.safeParse(req.body);

  if (!payload.success) {
    return res.status(400).json({ error: 'Invalid fields' });
  }

  try {
    const result = await closeDates({
      ...payload.data,
      tourId,
    });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function unblockDates(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { tourId } = req.params;

  if (Array.isArray(tourId)) {
    return res.status(400).json({ error: 'Invalid tourId' });
  }

  const payload = blockDatesSchema.safeParse(req.body);

  if (!payload.success) {
    return res.status(400).json({ error: 'Invalid fields' });
  }

  try {
    const result = await openDates({
      ...payload.data,
      tourId,
    });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
