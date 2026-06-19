import { NextFunction, Request, Response } from 'express';
import { likedTransfer, unlikeTransfer } from './like.service';
import { transferIdParams } from '../transfer.validator';

export async function likeTransferController(
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

  try {
    await likedTransfer({
      transferId: params.data.transferId,
      userId: req.user.userId,
    });

    res.json({ success: true, message: 'Added to liked' });
  } catch (error) {
    next(error);
  }
}

export async function unlikeTransferController(
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

  try {
    await unlikeTransfer({
      transferId: params.data.transferId,
      userId: req.user.userId,
    });

    res.json({ success: true, message: 'Remove from liked' });
  } catch (error) {
    next(error);
  }
}
