import { NextFunction, Request, Response } from 'express';
import {
  createFullTourSchema,
  tourParamsSchema,
  updatePartialTourSchema,
} from './tour.validator';
import {
  createFullTour,
  deleteTour,
  getTourBySlug,
  listTours,
  updateBaseTour,
} from './tour.service';

export async function getAllTours(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const payload = tourParamsSchema.safeParse(req.query);

  if (!payload.success) {
    throw new Error('Invalid fields');
  }

  try {
    const tours = await listTours(payload.data);

    res.json(tours);
  } catch (error) {
    next(error);
  }
}

export async function getTourDetail(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { slug } = req.params;

  if (Array.isArray(slug)) throw new Error('Invalid params');

  try {
    const tour = await getTourBySlug(slug);

    res.json(tour);
  } catch (error) {
    next(error);
  }
}

export async function addTour(req: Request, res: Response, next: NextFunction) {
  const payload = createFullTourSchema.safeParse(req.body);

  if (!payload.success) {
    throw new Error('Invalid fields');
  }

  try {
    const created = await createFullTour(payload.data);

    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
}

export async function editBaseTour(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { id } = req.params;
  const payload = updatePartialTourSchema.safeParse(req.body);

  if (!payload.success) {
    throw new Error('Invalid fields');
  }

  if (Array.isArray(id)) {
    throw new Error('Invalid params');
  }

  try {
    const edited = await updateBaseTour(id, payload.data);

    res.json(edited);
  } catch (error) {
    next(error);
  }
}

export async function removeTour(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { id } = req.params;

  if (Array.isArray(id)) {
    throw new Error('Invalid params');
  }

  try {
    await deleteTour(id);

    res.json({ message: 'Tour deleted successfully' });
  } catch (error) {
    next(error);
  }
}
