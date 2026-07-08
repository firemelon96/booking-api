import { NextFunction, Request, Response } from 'express';
import { setFeaturedService, updateTransferImages } from './image.service';
import { transferIdParams } from '../transfer.validator';
import { imageSchema, setFeaturedParams } from './image.validator';

export async function updateImagesController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const params = transferIdParams.safeParse(req.params);

  if (!params.success) {
    throw new Error('Invalid params');
  }

  const payload = imageSchema.safeParse(req.body);

  if (!payload.success) {
    throw new Error('Invalid fields');
  }

  try {
    await updateTransferImages(params.data.transferId, payload.data);

    res.json({ success: true, message: 'Images updated successfully.' });
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
