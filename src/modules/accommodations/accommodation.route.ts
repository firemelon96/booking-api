import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireAdmin } from '../../middlewares/role.middleware';
import {
  createAccommodation,
  getAccommodations,
  removeAccommodation,
  updateAccommodation,
} from './accommodation.controller';

import unitRoutes from './unit/units.routes';
import bookingRoutes from './booking/accommodation-booking.route';

const router = Router();

router.post('/', authenticate, requireAdmin, createAccommodation);
router.get('/', authenticate, requireAdmin, getAccommodations);
router.patch(
  '/:accommodationId',
  authenticate,
  requireAdmin,
  updateAccommodation,
);
router.delete(
  '/:accommodationId',
  authenticate,
  requireAdmin,
  removeAccommodation,
);

router.use('/:accommodationId/units', unitRoutes);
router.use('/:accommodationId/bookings', bookingRoutes);
// router.use('/:accommodationId/payment')

export default router;
