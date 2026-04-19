import { Request, Response } from 'express';
import {
  availabilityParam,
  availabilityQuerySchema,
} from '../validators/availability.schema';
import {
  getCalendarAvailability,
  getTourAvailability,
} from '../services/availability.service';

export async function getAvailability(req: Request, res: Response) {
  try {
    const tourId = req.params.tourId;

    if (Array.isArray(tourId)) {
      return res.status(400).json({ error: 'Invalid id' });
    }

    const query = availabilityQuerySchema.parse(req.query);

    const data = await getTourAvailability({
      tourId,
      start: query.start,
      end: query.end,
      pricingType: query.pricingType,
    });

    return res.json({
      tourId,
      start: query.start,
      end: query.end,
      availability: data,
    });
  } catch (err: any) {
    const msg = String(err?.message || 'Error');
    return res
      .status(msg.includes('not found') ? 404 : 400)
      .json({ error: msg });
  }
}

export async function availability(req: Request, res: Response) {
  try {
    const query = availabilityParam.parse(req.query);

    const data = await getCalendarAvailability({
      ...query,
    });

    return res.json(data);
  } catch (err: any) {
    const msg = String(err?.message || 'Error');
    return res
      .status(msg.includes('not found') ? 404 : 400)
      .json({ error: msg });
  }
}
