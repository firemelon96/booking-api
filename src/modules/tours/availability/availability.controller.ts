import { NextFunction, Request, Response } from 'express';
import { blockDatesSchema } from './availability.validator';
import { closeDates, unblockDates } from './availability.service';

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

export async function openDates(
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
    const result = await unblockDates({
      ...payload.data,
      tourId,
    });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
