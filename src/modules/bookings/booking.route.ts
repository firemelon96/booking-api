import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireAdmin } from '../../middlewares/role.middleware';
import {
  listAllBookings,
  adminCreateBooking,
  reschedBooking,
  cancelBooking,
  bookingDetail,
} from './booking.controller';
import { createPayment } from './payment/payment.controller';

const router = Router({ mergeParams: true });

router.get('/', authenticate, listAllBookings);
router.post('/', authenticate, requireAdmin, adminCreateBooking);
router.patch('/:bookingId/reschedule', authenticate, reschedBooking);
router.patch('/:bookingId/cancel', authenticate, cancelBooking);
router.get('/:bookingId', authenticate, bookingDetail);
router.post('/:bookingId/payment', authenticate, createPayment);

export default router;
