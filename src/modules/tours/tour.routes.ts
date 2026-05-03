import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireAdmin } from '../../middlewares/role.middleware';
import {
  addTour,
  editBaseTour,
  getAllTours,
  getTourDetail,
  removeTour,
} from './tour.controller';
import itineraryRoutes from '../tours/itinerary/itinerary.routes';
import pricingRoutes from '../tours/pricing/pricing.routes';
import imageRoutes from '../tours/images/image.routes';
import capacityRoutes from './capacity/capacity.routes';
import availabilityRoutes from './availability/availability.routes';
import calendarRoutes from './calendar/calendar.route';
import { userCreateBooking } from '../bookings/booking.controller';

const router = Router();

//tours
router.get('/', getAllTours);
router.get('/:slug', getTourDetail);

router.post('/', authenticate, requireAdmin, addTour);
router.patch('/:id', authenticate, requireAdmin, editBaseTour);
router.delete('/:id', authenticate, requireAdmin, removeTour);

router.post('/:tourId/booking', authenticate, userCreateBooking);

router.use('/:tourId/itinerary', itineraryRoutes);
router.use('/:tourId/pricing', pricingRoutes);
router.use('/:tourId/images', imageRoutes);
router.use('/:tourId/capacity', capacityRoutes);
router.use('/:tourId/availability', availabilityRoutes);

router.use('/:slug/calendar', calendarRoutes);

export default router;
