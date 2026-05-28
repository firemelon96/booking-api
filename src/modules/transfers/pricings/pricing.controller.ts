import { NextFunction, Request, Response } from 'express';
import { transferIdParams } from '../transfer.validator';
import { transferPricingSchema } from './pricing.validator';
import { modifyTransferPricing } from './pricing.service';

export async function modifyTransferPricingController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const params = transferIdParams.safeParse(req.params);

  if (!params.success) {
    throw new Error('Invalid params');
  }

  const payload = transferPricingSchema.array().safeParse(req.body);

  if (!payload.success) {
    throw new Error('Invalid fields');
  }

  try {
    const modifiedPricing = await modifyTransferPricing(
      params.data.transferId,
      payload.data,
    );

    res.json(modifiedPricing);
  } catch (error) {
    next(error);
  }
}
