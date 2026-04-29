import { Request, Response, NextFunction } from 'express';
import {
  bulkOverrideCapacitySchema,
  overrideCapacitySchema,
} from './capacity.validator';
import {
  bulkSetCapacity,
  deleteCapacity,
  updateCapacity,
  upsertCapacity,
} from './capacity.service';

export async function overrideCapacity(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { tourId } = req.params;
  const payload = overrideCapacitySchema.safeParse(req.body);

  if (Array.isArray(tourId)) {
    return res.status(400).json({ error: 'Invalid tourId' });
  }

  if (!payload.success) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  try {
    await upsertCapacity({
      tourId,
      ...payload.data,
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function bulkOverrideCapacity(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { tourId } = req.params;
  const payload = bulkOverrideCapacitySchema.safeParse(req.body);

  if (Array.isArray(tourId)) {
    return res.status(400).json({ error: 'Invalid tourId' });
  }

  if (!payload.success) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  try {
    const result = await bulkSetCapacity({
      tourId,
      ...payload.data,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function modifyCapacity(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { id } = req.params;
  const { capacity } = req.body;

  if (Array.isArray(id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }

  try {
    await updateCapacity({ id, capacity });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function resetCapacity(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { id } = req.params;

  if (Array.isArray(id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }

  try {
    await deleteCapacity({ id });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}
