import { Router } from 'express';
import { createPayment } from '../controllers/payment.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/create-payment-intent', authenticate, createPayment);

export default router;
