import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireAdmin } from '../../middlewares/role.middleware';
import {
  createTransferController,
  getAllTransferController,
  getTransferBySlugController,
  removeTransferController,
  updateTransferController,
} from './transfer.controller';

import transferBookingRoute from './bookings/booking.route';
import pricingRoute from './pricings/pricing.route';
import scheduleRoute from './schedules/schedule.route';
import calendarRoute from './calendar/transfer-calendar.route';

const router = Router({ mergeParams: true });

router.get('/', getAllTransferController);
router.get('/:slug', getTransferBySlugController);

router.post('/', authenticate, requireAdmin, createTransferController);

router.patch(
  '/:transferId',
  authenticate,
  requireAdmin,
  updateTransferController,
);
router.delete(
  '/:transferId',
  authenticate,
  requireAdmin,
  removeTransferController,
);

router.use('/:transferId/bookings', transferBookingRoute);

router.use('/:transferId/pricings', pricingRoute);
router.use('/:transferId/schedules', scheduleRoute);
router.use('/:slug/calendar', calendarRoute);

export default router;
