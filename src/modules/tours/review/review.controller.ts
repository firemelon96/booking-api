import { NextFunction, Request, Response } from 'express';
import { tourIdParams } from '../tour.validator';
import { createReviewSchema } from './review.validator';
import { addReviewService } from './review.service';

export async function reviewController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    throw new Error('Unauthorized');
  }

  const params = tourIdParams.safeParse(req.params);

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
      params.data.tourId,
      payload.data,
    );

    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
}
