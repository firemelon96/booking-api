import { Request, Response } from 'express';
import { createTourSchema, updateTourSchema } from '../validators/tour.schema';
import {
  createTour,
  deleteTour,
  getTourBySlug,
  listTours,
  updateTour,
} from '../services/tour.service';

export async function list(req: Request, res: Response) {
  try {
    const tours = await listTours();
    res.json(tours);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function getBySlug(req: Request, res: Response) {
  try {
    const slug = req.params.slug;
    if (Array.isArray(slug)) {
      return res.status(400).json({ error: 'Invalid slug' });
    }

    const tour = await getTourBySlug(slug);
    res.json(tour);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function create(req: Request, res: Response) {
  try {
    const data = createTourSchema.parse(req.body);
    const tour = await createTour(data);
    res.status(201).json(tour);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function update(req: Request, res: Response) {
  try {
    const id = req.params.id;

    if (Array.isArray(id)) {
      throw new Error('Invalid id params');
    }

    const data = updateTourSchema.parse(req.body);

    const tour = await updateTour(id, data);

    res.json(tour);
  } catch (err: any) {
    const msg = err.message || 'Error';
    res.status(msg.includes('not found') ? 404 : 400).json({ error: msg });
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const id = req.params.id;
    if (Array.isArray(id)) {
      throw new Error('Invalid id params');
    }

    await deleteTour(id);
    res.status(204).send();
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
}
