import { NextFunction, Request, Response } from 'express';
import {
  accommodationQuerySchema,
  createAccommodationSchema,
  updateAccommodationSchema,
} from './accommodation.validator';
import {
  createdAccommodation,
  listAccommodation,
  removedAccommodation,
  updatedAccommodation,
} from './accommodation.service';

export async function createAccommodation(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    throw new Error('Unauthorized');
  }

  const ownerId = req.user.userId;

  const payload = createAccommodationSchema.safeParse(req.body);

  if (!payload.success) {
    throw new Error('Invalid fields');
  }

  try {
    const created = await createdAccommodation(ownerId, payload.data);

    res.json(created);
  } catch (error) {
    next(error);
  }
}

export async function getAccommodations(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const payload = accommodationQuerySchema.safeParse(req.query);

  if (!payload.success) {
    throw new Error('Invalid fields');
  }

  try {
    const accommodations = await listAccommodation(payload.data);

    res.json(accommodations);
  } catch (error) {
    next(error);
  }
}

export async function updateAccommodation(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { accommodationId } = req.params;

  if (Array.isArray(accommodationId)) {
    throw new Error('Invalid params');
  }

  const payload = updateAccommodationSchema.safeParse(req.body);

  if (!payload.success) {
    throw new Error('Invalid fields');
  }

  try {
    const updated = await updatedAccommodation(accommodationId, payload.data);

    res.json(updated);
  } catch (error) {
    next(error);
  }
}

export async function removeAccommodation(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { accommodationId } = req.params;

  if (Array.isArray(accommodationId)) {
    throw new Error('Invalid params');
  }

  try {
    await removedAccommodation(accommodationId);

    res.json({ success: true, message: 'Deleted successfully.' });
  } catch (error) {
    next(error);
  }
}
