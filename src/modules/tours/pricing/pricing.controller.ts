import { NextFunction, Request, Response } from 'express';
import { createPricingArraySchema } from './pricing.validator';
import { modifyPricing } from './pricing.service';

export async function replacePricing(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { tourId } = req.params;
  const payload = createPricingArraySchema.safeParse(req.body);

  if (!payload.success) {
    throw new Error('Invalid fields');
  }

  if (Array.isArray(tourId)) {
    throw new Error('Invalid params');
  }

  console.log(tourId);

  try {
    const modified = await modifyPricing(tourId, payload.data);

    res.json(modified);
  } catch (error) {
    next(error);
  }
}
