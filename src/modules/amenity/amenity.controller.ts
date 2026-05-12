import { NextFunction, Request, Response } from 'express';
import { createdAmenity, fetchAmenities } from './amenity.service';
import { createAmenitySchema } from './amenity.validator';

export async function getAmenities(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const amenities = await fetchAmenities();

    res.json(amenities);
  } catch (error) {
    next(error);
  }
}

export async function createAmenity(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const payload = createAmenitySchema.safeParse(req.body);

  if (!payload.success) {
    throw new Error('Invalid fields');
  }

  try {
    const created = await createdAmenity(payload.data);

    res.json(created);
  } catch (error) {
    next(error);
  }
}
