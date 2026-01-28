import { Router } from 'express';
import { calculatePricing } from '../controllers/pricing.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/calculate', authenticate, calculatePricing);

export default router;
