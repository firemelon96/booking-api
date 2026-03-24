import { Request, Response } from 'express';
import { createItinerarySchema } from '../validators/itinerary.schema';
import { addItinerary } from '../services/itinerary.service';

export async function addItineraryCtrl(req: Request, res: Response) {
  try {
    const { tourId } = req.params;

    if (Array.isArray(tourId)) {
      throw new Error('Invalid id params');
    }

    const body = createItinerarySchema.parse(req.body);

    const create = await addItinerary({
      tourId,
      ...body,
    });

    res.status(401).json(create);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
