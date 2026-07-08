import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireAdmin } from '../../middlewares/role.middleware';
import {
  createAccommodation,
  getAccommodationDetailController,
  getAccommodations,
  removeAccommodation,
  updateAccommodation,
} from './accommodation.controller';
import accommodationCalendarRoute from './calendar/calendar.route';
import inventoryRoute from './inventory/inventory.route';

import unitRoutes from './unit/units.routes';
import bookingRoutes from './booking/accommodation-booking.route';

const router = Router();

router.get('/', getAccommodations);
router.get('/:slug', getAccommodationDetailController);

router.post('/', authenticate, requireAdmin, createAccommodation);
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
router.use('/:slug/calendar', accommodationCalendarRoute);
router.use('/:accommodationId/inventory', inventoryRoute);

export default router;
