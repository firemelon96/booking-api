import { Request, Response } from 'express';
import { daysSchema } from './itinerary.validator';
import { modifyItinerary } from './itinerary.service';

export async function replaceItinerary(req: Request, res: Response) {
  const { tourId } = req.params;
  const payload = daysSchema.safeParse(req.body);

  if (Array.isArray(tourId)) {
    throw new Error('Invalid params');
  }

  if (!payload.success) {
    throw new Error('Invalid fields');
  }

  try {
    const replaced = await modifyItinerary(tourId, payload.data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}
