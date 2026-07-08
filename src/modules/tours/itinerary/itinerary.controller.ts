import { Request, Response } from 'express';
import { daysSchema } from './itinerary.validator';
import { modifyItinerary } from './itinerary.service';
import { tourIdParams } from '../tour.validator';

export async function replaceItinerary(req: Request, res: Response) {
  const params = tourIdParams.safeParse(req.params);
  const payload = daysSchema.safeParse(req.body);

  if (!params.success) {
    throw new Error('Invalid params');
  }

  if (!payload.success) {
    throw new Error('Invalid fields');
  }

  try {
    const replaced = await modifyItinerary(params.data.tourId, payload.data);

    res.json(replaced);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}
