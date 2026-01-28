import { Router } from 'express';
import {
  list,
  create,
  getBySlug,
  remove,
  update,
} from '../controllers/tour.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';
import tourPricingRoutes from './tourPricing.routes';

const router = Router();

(router.get('/', list), router.get('/:slug', getBySlug));

router.post('/', authenticate, requireAdmin, create);
router.patch('/:id', authenticate, requireAdmin, update);
router.delete('/:id', authenticate, requireAdmin, remove);

router.use('/:tourId/pricing', tourPricingRoutes);

export default router;
