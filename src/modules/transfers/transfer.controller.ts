import { NextFunction, Request, Response } from 'express';
import {
  createTransferSchema,
  transferIdParams,
  transferQuerySchema,
  transferSlugParams,
  updateBaseTransferSchema,
} from './transfer.validator';
import {
  createdTransferService,
  getAllTransferService,
  getTransferBySlugService,
  removedTransferService,
  updatedTransferService,
} from './transfer.service';

export async function getAllTransferController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const payload = transferQuerySchema.safeParse(req.query);

  if (!payload.success) {
    throw new Error('Invalid fields');
  }

  try {
    const transfersList = await getAllTransferService(payload.data);

    res.json(transfersList);
  } catch (error) {
    next(error);
  }
}

export async function getTransferBySlugController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const params = transferSlugParams.safeParse(req.params);

  if (!params.success) {
    throw new Error('Invalid params');
  }

  try {
    const detailedTransfer = await getTransferBySlugService(params.data.slug);

    res.json(detailedTransfer);
  } catch (error) {
    next(error);
  }
}

export async function createTransferController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    throw new Error('Unauthorized');
  }

  const payload = createTransferSchema.safeParse(req.body);

  if (!payload.success) {
    throw new Error('Invalid fields');
  }

  try {
    const created = await createdTransferService(req.user.userId, payload.data);

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
  const { transferId } = req.params;

  if (Array.isArray(transferId)) {
    throw new Error('Invalid params');
  }

  const payload = updateBaseTransferSchema.safeParse(req.body);

  if (!payload.success) {
    throw new Error('Invalid fields');
  }

  try {
    const created = await updatedTransferService(transferId, payload.data);

    res.json(created);
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
    await removedTransferService(payload.data.transferId);

    res.json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    next(error);
  }
}
