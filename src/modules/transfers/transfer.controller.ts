import { NextFunction, Request, Response } from 'express';
import { createTransferSchema, transferIdParams } from './transfer.validator';
import {
  createdTransferService,
  removedTransferService,
  updatedTransferService,
} from './transfer.service';

export async function createTransferController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const payload = createTransferSchema.safeParse(req.body);

  if (!payload.success) {
    throw new Error('Invalid fields');
  }

  try {
    const created = await createdTransferService(payload.data);

    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
}

export async function updateTransferController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const payload = transferIdParams.safeParse(req.params);

  if (!payload.success) {
    throw new Error('Invalid fields');
  }

  try {
    const created = await updatedTransferService(payload.data.transferId);

    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
}

export async function removeTransferController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const payload = transferIdParams.safeParse(req.params);

  if (!payload.success) {
    throw new Error('Invalid fields');
  }

  try {
    const created = await removedTransferService(payload.data.transferId);

    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
}
