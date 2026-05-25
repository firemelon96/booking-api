import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireAdmin } from '../../middlewares/role.middleware';
import {
  listAllBookings,
  adminCreateBooking,
  reschedBooking,
  cancelBooking,
  bookingDetail,
  referenceBooking,
} from './booking.controller';
import { createPayment } from './payment/payment.controller';
import { adminCreateAccommodationBooking } from '../accommodations/booking/accommodation-booking.controller';

const router = Router({ mergeParams: true });

router.post('/tours', authenticate, requireAdmin, adminCreateBooking);
router.post(
  '/accommodations',
  authenticate,
  requireAdmin,
  adminCreateAccommodationBooking,
);

router.get('/', authenticate, listAllBookings);
router.patch('/:bookingId/reschedule', authenticate, reschedBooking);
router.patch('/:bookingId/cancel', authenticate, cancelBooking);
router.get('/:bookingId', authenticate, bookingDetail);
// router.post('/:bookingId/payment', authenticate, createPayment);
router.get('/reference', authenticate, referenceBooking);
// router.post('/:bookingId/payment', authenticate, createAccommodationPayment);

export default router;
