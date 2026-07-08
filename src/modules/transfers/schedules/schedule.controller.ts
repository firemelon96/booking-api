import { NextFunction, Request, Response } from 'express';
import { transferIdParams } from '../transfer.validator';
import { modifySchedules } from './schedule.service';
import { transferScheduleSchema } from './schedule.validator';

export async function modifyScheduleController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const params = transferIdParams.safeParse(req.params);

  if (!params.success) {
    throw new Error('Invalid params');
  }

  const payload = transferScheduleSchema.array().safeParse(req.body);

  if (!payload.success) {
    throw new Error('Invalid params');
  }

  try {
    const modified = await modifySchedules(
      params.data.transferId,
      payload.data,
    );

    res.json(modified);
  } catch (error) {
    next(error);
  }
}
