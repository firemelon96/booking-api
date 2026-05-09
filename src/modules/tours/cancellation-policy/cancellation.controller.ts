import { NextFunction, Request, Response } from 'express';
import { cancellationPolicySchema } from './cancellation.validator';
import {
  addCancellationPolicy,
  deletedPolicy,
  modifiedPolicy,
} from './cancellation.service';

export async function createPolicy(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const input = {
    ...req.params,
    ...req.body,
  };

  const payload = cancellationPolicySchema.safeParse(input);

  if (!payload.success) {
    throw new Error('Invalid fields');
  }

  try {
    const created = await addCancellationPolicy(payload.data);

    res.json(created);
  } catch (error) {
    next(error);
  }
}

export async function modifyPolicy(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const input = {
    ...req.params,
    ...req.body,
  };

  const payload = cancellationPolicySchema.safeParse(input);

  if (!payload.success) {
    throw new Error('Invalid fields');
  }

  try {
    const modified = await modifiedPolicy(payload.data);

    res.json(modified);
  } catch (error) {
    next(error);
  }
}

export async function deletePolicy(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { tourId } = req.params;

  if (Array.isArray(tourId)) {
    throw new Error('Invalid params');
  }

  try {
    await deletedPolicy(tourId);

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}
