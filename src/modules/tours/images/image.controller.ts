import { NextFunction, Request, Response } from 'express';
import { findTourOrFail } from '../tour.query';
import { updateTourImages } from './images.service';

export async function replaceImages(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { tourId } = req.params;
  const { existingImageIds, newImageIds } = req.body;

  if (Array.isArray(tourId)) {
    throw new Error('Invalid params');
  }

  await findTourOrFail(tourId);

  try {
    await updateTourImages(tourId, { existingImageIds, newImageIds });

    res.json({ message: 'Images updated successfully' });
  } catch (error) {
    next(error);
  }
}
