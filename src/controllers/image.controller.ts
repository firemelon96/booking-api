import { Request, Response } from 'express';
import { setFeaturedImage } from '../services/image.service';

export async function setFeatured(req: Request, res: Response) {
  try {
    const { tourId, imageId } = req.params;

    if (Array.isArray(tourId) || Array.isArray(imageId)) {
      throw new Error('Invalid params');
    }

    const result = await setFeaturedImage(tourId, imageId);

    res.json(result);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
}
