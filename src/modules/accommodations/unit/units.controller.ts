import { NextFunction, Request, Response } from 'express';
import { createUnitSchema, unitQuerySchema } from './units.validator';
import {
  createdUnit,
  deleteUnit,
  listUnits,
  updatedUnit,
} from './units.service';

export async function createUnit(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { accommodationId } = req.params;

  if (Array.isArray(accommodationId)) {
    throw new Error('Invalid params');
  }

  const input = {
    accommodationId,
    ...req.body,
  };

  const payload = createUnitSchema.safeParse(input);

  if (!payload.success) {
    throw new Error('Invalid fields');
  }

  try {
    const created = await createdUnit(accommodationId, payload.data);

    res.json(created);
  } catch (error) {
    next(error);
  }
}

export async function updateUnit(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { accommodationId } = req.params;
  const { unitId } = req.params;

  if (Array.isArray(accommodationId) || Array.isArray(unitId)) {
    throw new Error('Invalid params');
  }

  const payload = createUnitSchema.safeParse(req.body);

  if (!payload.success) {
    throw new Error('Invalid fields');
  }

  try {
    const updated = await updatedUnit(accommodationId, unitId, payload.data);

    res.json(updated);
  } catch (error) {
    next(error);
  }
}

export async function getUnits(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const input = {
    accommodationId: req.params.accommodationId,
    ...req.query,
  };

  const payload = unitQuerySchema.safeParse(input);

  if (!payload.success) {
    throw new Error('Invalid fields');
  }

  try {
    const units = await listUnits(payload.data);
    res.json(units);
  } catch (error) {
    next(error);
  }
}

export async function removeUnit(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { accommodationId } = req.params;
  const { unitId } = req.params;

  if (Array.isArray(accommodationId) || Array.isArray(unitId)) {
    throw new Error('Invalid params');
  }

  try {
    await deleteUnit(accommodationId, unitId);
  } catch (error) {
    next(error);
  }
}
