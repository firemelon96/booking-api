import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import { requireAdmin } from '../../../middlewares/role.middleware';
import { replacePricing } from './pricing.controller';

const router = Router();

router.put('/', authenticate, requireAdmin, replacePricing);

export default router;
