import { NextFunction, Request, Response } from 'express';
import { closeInventorySchema } from './inventory.validator';
import { accommodationIdParams } from '../booking/accommodation-booking.validator';
import {
  closeInventoryService,
  openInventoryService,
} from './inventory-close.service';

export async function closeInventoryController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const params = accommodationIdParams.safeParse(req.params);

  const payload = closeInventorySchema.safeParse(req.body);

  if (!params.success || !payload.success) {
    throw new Error('Invalid params or fields');
  }

  try {
    const closedDates = await closeInventoryService(
      params.data.accommodationId,
      payload.data,
    );

    res.json(closedDates);
  } catch (error) {
    next(error);
  }
}

export async function openInventoryController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const params = accommodationIdParams.safeParse(req.params);

  const payload = closeInventorySchema.safeParse(req.body);

  if (!params.success || !payload.success) {
    throw new Error('Invalid params or fields');
  }

  try {
    const closedDates = await openInventoryService(
      params.data.accommodationId,
      payload.data,
    );

    res.json(closedDates);
  } catch (error) {
    next(error);
  }
}
