import { NextFunction, Request, Response } from 'express';
import {
  createRentalBodySchema,
  rentalIdParamsSchema,
  rentalQuerySchema,
  rentalSlugParamsSchema,
  updateRentalBodySchema,
} from './rental.validator';
import {
  createRentalService,
  getAllRentalsService,
  getRentalDetailService,
  removeRentalService,
  updateRentalService,
} from './rental.service';

export async function getAllRentalsController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const query = rentalQuerySchema.safeParse(req.query);

  if (!query.success) {
    return res.status(400).json({ error: 'Invalid query parameters' });
  }

  try {
    const rentals = await getAllRentalsService(query.data);

    res.json(rentals);
  } catch (error) {
    next(error);
  }
}

export async function getRentalDetailController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const params = rentalSlugParamsSchema.safeParse(req.params);

  if (!params.success) {
    return res.status(400).json({ error: 'Invalid query parameters' });
  }

  try {
    const rental = await getRentalDetailService(params.data.slug);

    res.json(rental);
  } catch (error) {
    next(error);
  }
}

export async function createRentalController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const payload = createRentalBodySchema.safeParse(req.body);

  if (!payload.success) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  try {
    const created = await createRentalService(req.user.userId, payload.data);

    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
}

export async function updateRentalController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const params = rentalIdParamsSchema.safeParse(req.params);

  if (!params.success) {
    return res.status(400).json({ error: 'Invalid query parameters' });
  }

  const payload = updateRentalBodySchema.safeParse(req.body);

  if (!payload.success) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  try {
    const updated = await updateRentalService(
      params.data.rentalId,
      payload.data,
    );
    res.json(updated);
  } catch (error) {
    next(error);
  }
}

export async function removeRentalController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const params = rentalIdParamsSchema.safeParse(req.params);

  if (!params.success) {
    return res.status(400).json({ error: 'Invalid query parameters' });
  }
  try {
    await removeRentalService(params.data.rentalId);
    res.status(200).send({ message: 'Rental removed successfully' });
  } catch (error) {
    next(error);
  }
}
