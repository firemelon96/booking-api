import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import { requireAdmin } from '../../../middlewares/role.middleware';
import {
  createRentalPricingController,
  deleteRentalPricingController,
  updateRentalPricingController,
} from './rental-pricing.controller';

const router = Router({ mergeParams: true });

router.patch(
  '/:pricingId',
  authenticate,
  requireAdmin,
  updateRentalPricingController,
);

router.delete(
  '/:pricingId',
  authenticate,
  requireAdmin,
  deleteRentalPricingController,
);

router.post('/', authenticate, requireAdmin, createRentalPricingController);

export default router;
