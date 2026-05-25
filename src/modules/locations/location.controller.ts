import { NextFunction, Request, Response } from 'express';
import {
  addLocationSchema,
  locationIdParams,
  locationQuerySchema,
} from './location.validator';
import {
  addLocationService,
  listLocationService,
  removeLocationService,
  updateLocationService,
} from './location.service';

export async function addLocationController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const payload = addLocationSchema.safeParse(req.body);

  if (!payload.success) {
    throw new Error('Invalid fields');
  }

  try {
    const addedLocation = await addLocationService(payload.data);

    res.status(201).json(addedLocation);
  } catch (error) {
    next(error);
  }
}

export async function updateLocationController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const locationId = locationIdParams.safeParse(req.params);

  if (!locationId.success) {
    throw new Error('Invalid params');
  }

  const payload = addLocationSchema.safeParse(req.body);

  if (!payload.success) {
    throw new Error('Invalid fields');
  }

  try {
    const addedLocation = await updateLocationService(
      locationId.data.locationId,
      payload.data,
    );

    res.status(201).json(addedLocation);
  } catch (error) {
    next(error);
  }
}

export async function removeLocationController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const locationId = locationIdParams.safeParse(req.params);

  if (!locationId.success) {
    throw new Error('Invalid params');
  }

  try {
    const addedLocation = await removeLocationService(
      locationId.data.locationId,
    );

    res.status(201).json(addedLocation);
  } catch (error) {
    next(error);
  }
}

export async function listLocationController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const payload = locationQuerySchema.safeParse(req.query);

  if (!payload.success) {
    throw new Error('Invalid fields');
  }

  try {
    const lists = await listLocationService(payload.data);

    res.json(lists);
  } catch (error) {
    next(error);
  }
}
