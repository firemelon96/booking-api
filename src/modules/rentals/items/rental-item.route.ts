import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import { requireAdmin } from '../../../middlewares/role.middleware';
import {
  bulkCreateRentalItemsController,
  createRentalItemController,
  removeRentalItemController,
  updateRentalItemController,
} from './rental-item.controller';
import rentalPricingRoutes from '../pricings/rental-pricing.route';

const router = Router({ mergeParams: true });

router.post('/', authenticate, requireAdmin, createRentalItemController);
router.post(
  '/bulk-create',
  authenticate,
  requireAdmin,
  bulkCreateRentalItemsController,
);
router.patch(
  '/:itemId',
  authenticate,
  requireAdmin,
  updateRentalItemController,
);
router.delete(
  '/:itemId',
  authenticate,
  requireAdmin,
  removeRentalItemController,
);

router.use('/:itemId/pricings', rentalPricingRoutes);

export default router;
