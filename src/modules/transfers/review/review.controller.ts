import { NextFunction, Request, Response } from 'express';
import { createReviewSchema } from './review.validator';
import { addReviewService } from './review.service';
import { transferIdParams } from '../transfer.validator';

export async function reviewController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    throw new Error('Unauthorized');
  }

  const params = transferIdParams.safeParse(req.params);

  if (!params.success) {
    throw new Error('Invalid fields');
  }

  const payload = createReviewSchema.safeParse(req.body);

  if (!payload.success) {
    throw new Error('Invalid fields');
  }

  try {
    const created = await addReviewService(
      req.user.userId,
      params.data.transferId,
      payload.data,
    );

    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
}
