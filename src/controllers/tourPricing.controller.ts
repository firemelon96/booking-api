import { Request, Response } from 'express';
import {
  createTourPricingSchema,
  updateTourPricingSchema,
} from '../validators/tourPricing.schema';
import {
  listTourPricing,
  createTourPricing,
  updateTourPricing,
  deleteTourPricing,
} from '../services/tourPricing.service';

export async function list(req: Request, res: Response) {
  try {
    const tourId = req.params.tourId;

    if (Array.isArray(tourId)) {
      throw new Error('Invalid tour id');
    }

    const data = await listTourPricing(tourId);

    res.json(data);
  } catch (err: any) {
    res
      .status(err.message?.includes('not found') ? 404 : 400)
      .json({ error: err.message });
  }
}

export async function create(req: Request, res: Response) {
  try {
    const tourId = req.params.tourId;

    if (Array.isArray(tourId)) {
      throw new Error('Invalid tour id');
    }

    const body = createTourPricingSchema.parse(req.body);

    const created = await createTourPricing({
      tourId,
      pricingType: body.pricingType,
      minGroupSize: body.minGroupSize,
      maxGroupSize: body.maxGroupSize,
      price: body.price,
      isGroupPrice: body.isGroupPrice ?? false,
    });

    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function update(req: Request, res: Response) {
  try {
    const tourId = req.params.tourId;
    const pricingId = req.params.pricingId;

    if (Array.isArray(tourId) || Array.isArray(pricingId)) {
      throw new Error('Invalid params type');
    }

    const body = updateTourPricingSchema.parse(req.body);

    const updated = await updateTourPricing({
      tourId,
      pricingId,
      ...body,
    });

    res.json(updated);
  } catch (err: any) {
    res
      .status(err.message?.includes('not found') ? 404 : 400)
      .json({ error: err.message });
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const tourId = req.params.tourId;
    const pricingId = req.params.pricingId;

    if (Array.isArray(tourId) || Array.isArray(pricingId)) {
      throw new Error('Invalid params type');
    }

    await deleteTourPricing({ tourId, pricingId });

    res.status(204).send();
  } catch (err: any) {
    res
      .status(err.message?.includes('not found') ? 404 : 400)
      .json({ error: err.message });
  }
}
