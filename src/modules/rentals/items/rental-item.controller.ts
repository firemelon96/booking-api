import { NextFunction, Request, Response } from 'express';
import { rentalIdParamsSchema } from '../rental.validator';
import {
  rentalItemIdParamsSchema,
  rentalItemsSchema,
} from './rental-item.validator';
import {
  createBulkRentalItemsService,
  createRentalItemService,
  removeRentalItemService,
  updateRentalItemService,
} from './rental-item.service';

export async function createRentalItemController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const params = rentalIdParamsSchema.safeParse(req.params);

  const payload = rentalItemsSchema.safeParse(req.body);

  if (!payload.success) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  if (!params.success) {
    return res.status(400).json({ error: 'Invalid query parameters' });
  }

  try {
    const createdItem = await createRentalItemService(
      params.data.rentalId,
      payload.data,
    );

    res.status(201).json(createdItem);
  } catch (error) {
    next(error);
  }
}

export async function bulkCreateRentalItemsController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const params = rentalIdParamsSchema.safeParse(req.params);

  const payload = rentalItemsSchema.array().safeParse(req.body);

  if (!payload.success) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  if (!params.success) {
    return res.status(400).json({ error: 'Invalid query parameters' });
  }

  try {
    const createdItems = await createBulkRentalItemsService(
      params.data.rentalId,
      payload.data,
    );

    res.status(201).json(createdItems);
  } catch (error) {
    next(error);
  }
}

export async function updateRentalItemController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const params = rentalItemIdParamsSchema.safeParse(req.params);

  const payload = rentalItemsSchema.safeParse(req.body);

  if (!payload.success) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  if (!params.success) {
    return res.status(400).json({ error: 'Invalid query parameters' });
  }

  try {
    const updatedItem = await updateRentalItemService(
      params.data,
      payload.data,
    );
    res.status(200).json(updatedItem);
  } catch (error) {
    next(error);
  }
}

export async function removeRentalItemController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const params = rentalItemIdParamsSchema.safeParse(req.params);

  if (!params.success) {
    return res.status(400).json({ error: 'Invalid query parameters' });
  }

  try {
    await removeRentalItemService(params.data);
    res.status(200).json({ message: 'Rental item removed successfully' });
  } catch (error) {
    next(error);
  }
}
