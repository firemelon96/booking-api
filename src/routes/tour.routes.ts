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
import availabilityRoutes from './availability.routes';

const router = Router();

(router.get('/', list), router.get('/:slug', getBySlug));

router.post('/', authenticate, requireAdmin, create);
router.patch('/:id', authenticate, requireAdmin, update);
router.delete('/:id', authenticate, requireAdmin, remove);

router.use('/:tourId/pricing', tourPricingRoutes);

router.use('/:tourId/availability', availabilityRoutes);

export default router;
