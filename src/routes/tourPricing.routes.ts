import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';
import * as ctrl from '../controllers/tourPricing.controller';

const router = Router({ mergeParams: true });

router.get('/', ctrl.list);

router.post('/', authenticate, requireAdmin, ctrl.create);
router.patch('/:pricingId', authenticate, requireAdmin, ctrl.update);
router.delete('/:pricingId', authenticate, requireAdmin, ctrl.remove);

export default router;
