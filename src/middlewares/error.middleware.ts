import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      type: 'VALIDATION_ERROR',
      errors: err.flatten().fieldErrors,
    });
  }

  if (err instanceof Error) {
    return res.status(500).json({
      type: 'INTERNAL_ERROR',
      message: err.message,
    });
  }

  return res.status(500).json({
    type: 'UNKNOWN_ERROR',
    message: 'Something went wrong',
  });
}
