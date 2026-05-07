import { NextFunction, Request, Response } from 'express';
import { fetchAllUser, fetchProfile } from './user.service';
import { userQuerySchema } from './user.validation';

export async function getAllUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const payload = userQuerySchema.safeParse(req.query);

  if (!payload.success) {
    throw new Error('Invalid fields');
  }

  try {
    const users = await fetchAllUser(payload.data);

    return res.json(users);
  } catch (error) {
    next(error);
  }
}

export async function profile(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    throw new Error('Unauthorized');
  }

  try {
    const profile = await fetchProfile(req.user.userId);

    return res.json(profile);
  } catch (error) {
    next(error);
  }
}
