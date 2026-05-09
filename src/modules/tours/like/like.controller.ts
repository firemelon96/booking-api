import { NextFunction, Request, Response } from 'express';
import { likedTour, unlikeTour } from './like.service';

export async function likeTour(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { tourId } = req.params;

  if (!req.user) {
    throw new Error('Unauthorized');
  }

  if (Array.isArray(tourId)) {
    throw new Error('Invalid params');
  }

  try {
    await likedTour({ tourId, userId: req.user.userId });

    res.json({ success: true, message: 'Added to liked' });
  } catch (error) {
    next(error);
  }
}

export async function removeLike(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { tourId } = req.params;

  if (!req.user) {
    throw new Error('Unauthorized');
  }

  if (Array.isArray(tourId)) {
    throw new Error('Invalid params');
  }

  try {
    await unlikeTour({ tourId, userId: req.user.userId });

    res.json({ success: true, message: 'Remove from liked' });
  } catch (error) {
    next(error);
  }
}
