import { Request, Response, NextFunction } from 'express';

export async function overrideCapacity(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
  } catch (error) {
    next(error);
  }
}
