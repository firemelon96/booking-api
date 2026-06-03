import { Request, Response, NextFunction } from 'express';
import {
  createRentalPricingBodySchema,
  rentalPricingIdParamsSchema,
  updateRentalPricingBodySchema,
} from './rental-pricing.validator';
import {
  createRentalPricingService,
  deleteRentalPricingService,
  updateRentalPricingService,
} from './rental-pricing.service';
import { rentalItemIdParamsSchema } from '../items/rental-item.validator';

export async function updateRentalPricingController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const params = rentalPricingIdParamsSchema.safeParse(req.params);

  const payload = updateRentalPricingBodySchema.safeParse(req.body);

  if (!payload.success) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  if (!params.success) {
    return res.status(400).json({ error: 'Invalid query parameters' });
  }

  try {
    const updatedPricing = await updateRentalPricingService(
      params.data,
      payload.data,
    );

    res.json(updatedPricing);
  } catch (error) {
    next(error);
  }
}

export async function deleteRentalPricingController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const params = rentalPricingIdParamsSchema.safeParse(req.params);

  if (!params.success) {
    return res.status(400).json({ error: 'Invalid query parameters' });
  }

  try {
    await deleteRentalPricingService(params.data);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function createRentalPricingController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const rentalItemIdParams = rentalItemIdParamsSchema.safeParse(req.params);

  const payload = createRentalPricingBodySchema.safeParse(req.body);

  if (!payload.success) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  if (!rentalItemIdParams.success) {
    return res.status(400).json({ error: 'Invalid query parameters' });
  }

  try {
    const createdPricing = await createRentalPricingService(
      rentalItemIdParams.data.itemId,
      payload.data,
    );

    res.status(201).json(createdPricing);
  } catch (error) {
    next(error);
  }
}
