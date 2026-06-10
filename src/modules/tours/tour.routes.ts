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
import tourBookingRoutes from './booking/tour-booking.route';
import availabilityRoutes from './availability/availability.routes';
import calendarRoutes from './calendar/calendar.route';
import likeRoutes from './like/like.route';
import cancellationPolicyRoutes from './cancellation-policy/cancellation.route';

const router = Router();

//public
router.get('/', getAllTours);
router.get('/:slug', getTourDetail);
router.use('/:slug/calendar', calendarRoutes);

//admin crud operation
router.post('/', authenticate, requireAdmin, addTour);
router.patch('/:id', authenticate, requireAdmin, editBaseTour);
router.delete('/:id', authenticate, requireAdmin, removeTour);

router.use('/:tourId/itinerary', itineraryRoutes);
router.use('/:tourId/pricing', pricingRoutes);
router.use('/:tourId/images', imageRoutes);

router.use('/:tourId/capacity', capacityRoutes);
router.use('/:tourId/availability', availabilityRoutes);
router.use('/:tourId/cancellation-policy', cancellationPolicyRoutes);
router.use('/:tourId/like', likeRoutes);

//auth user
router.use('/:tourId/booking', tourBookingRoutes);

export default router;
