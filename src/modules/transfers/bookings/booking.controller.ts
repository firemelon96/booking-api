import { NextFunction, Request, Response } from 'express';
import { createTransferBookingService } from './booking.service';
import { createTransferBookingSchema } from './booking.validator';
import { transferIdParams } from '../transfer.validator';

export async function createTransferBookingController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    throw new Error('Unauthorized');
  }

  const params = transferIdParams.safeParse(req.params);

  if (!params.success) {
    throw new Error('Invalid params');
  }

  const payload = createTransferBookingSchema.safeParse(req.body);

  if (!payload.success) {
    throw new Error('Invalid fields');
  }

  try {
    const created = await createTransferBookingService(
      params.data.transferId,
      req.user.role,
      req.user.role,
      payload.data,
    );
    res.json(created);
  } catch (error) {
    next(error);
  }
}
