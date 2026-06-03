import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireAdmin } from '../../middlewares/role.middleware';
import {
  createRentalController,
  getAllRentalsController,
  getRentalDetailController,
  removeRentalController,
  updateRentalController,
} from './rental.controller';

import rentalItemRoutes from './items/rental-item.route';

const router = Router({ mergeParams: true });

router.get('/', getAllRentalsController);
router.get('/:slug', getRentalDetailController);

router.post('/', authenticate, requireAdmin, createRentalController);
router.patch('/:rentalId', authenticate, requireAdmin, updateRentalController);
router.delete('/:rentalId', authenticate, requireAdmin, removeRentalController);

router.use('/:rentalId/items', rentalItemRoutes);

export default router;
