import { NextFunction, Request, Response } from 'express';
import { xenditPayment } from './xendit.service';

export async function xenditWebhook(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const body = req.body; //TODO get the xendit body type from dashboard

  const signature = req.headers['x-callback-token'] as string;

  if (!body || !signature) {
    throw new Error('Invalid fields');
  }

  try {
    await xenditPayment(signature, body.id, body.status);

    return res.json({ message: 'Webhook processed successfully' });
  } catch (error) {
    next(error);
  }
}
