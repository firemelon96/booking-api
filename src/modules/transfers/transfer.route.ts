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
import likeRoute from './like/like.route';
import imageRoute from './images/image.route';

const router = Router({ mergeParams: true });

//public
router.get('/', getAllTransferController);
router.get('/:slug', getTransferBySlugController);
router.use('/:slug/calendar', calendarRoute);

//admin
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
router.use('/:transferId/pricings', pricingRoute);
router.use('/:transferId/schedules', scheduleRoute);
router.use('/:transferId/images', imageRoute);
//loggedin user
router.use('/:transferId/bookings', transferBookingRoute);
router.use('/:transferId/like', likeRoute);

export default router;
