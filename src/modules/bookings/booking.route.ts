import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireAdmin } from '../../middlewares/role.middleware';
import {
  listAllBookings,
  reschedBooking,
  cancelBooking,
  bookingDetail,
  referenceBooking,
} from './booking.controller';
import { adminCreateAccommodationBooking } from '../accommodations/booking/accommodation-booking.controller';
import { adminCreateTourBooking } from '../tours/booking/tour-booking.controller';
import { adminCreateRentalBookingController } from '../rentals/bookings/rental-booking.controller';
import { adminCreateTransferBookingController } from '../transfers/bookings/booking.controller';

const router = Router({ mergeParams: true });

router.post('/tours', authenticate, requireAdmin, adminCreateTourBooking);
router.post(
  '/accommodations',
  authenticate,
  requireAdmin,
  adminCreateAccommodationBooking,
);
router.post(
  '/rentals',
  authenticate,
  requireAdmin,
  adminCreateRentalBookingController,
);
router.post(
  '/transfers',
  authenticate,
  requireAdmin,
  adminCreateTransferBookingController,
);

router.get('/', authenticate, listAllBookings);
router.patch('/:bookingId/reschedule', authenticate, reschedBooking);
router.patch('/:bookingId/cancel', authenticate, cancelBooking);
router.get('/:bookingId', authenticate, bookingDetail);
// router.post('/:bookingId/payment', authenticate, createPayment);
router.get('/reference', authenticate, referenceBooking);
// router.post('/:bookingId/payment', authenticate, createAccommodationPayment);

export default router;
