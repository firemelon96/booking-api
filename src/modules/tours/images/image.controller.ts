import { NextFunction, Request, Response } from 'express';
import { findTourOrFail } from '../tour.query';
import { setFeaturedService, updateTourImages } from './images.service';
import { tourIdParams } from '../tour.validator';
import { setFeaturedParams } from './image.validator';

export async function replaceImages(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { existingImageIds, newImageIds } = req.body;

  const params = tourIdParams.safeParse(req.params);

  if (!params.success) {
    throw new Error('Invalid params');
  }

  try {
    await updateTourImages(params.data.tourId, {
      existingImageIds,
      newImageIds,
    });

    res.json({ message: 'Images updated successfully' });
  } catch (error) {
    next(error);
  }
}

export async function setFeaturedController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const params = setFeaturedParams.safeParse(req.params);

  if (!params.success) {
    throw new Error('Invalid params');
  }

  try {
    await setFeaturedService(params.data);

    res.json({ message: 'Image featured set!' });
  } catch (error) {
    next(error);
  }
}
