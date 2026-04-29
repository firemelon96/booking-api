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

const router = Router();

//tours
router.get('/', getAllTours);
router.get('/:slug', getTourDetail);

router.post('/', authenticate, requireAdmin, addTour);
router.patch('/:id', authenticate, requireAdmin, editBaseTour);
router.delete('/:id', authenticate, requireAdmin, removeTour);

router.use('/:tourId', itineraryRoutes);
router.use('/:tourId', pricingRoutes);
router.use('/:tourId', imageRoutes);

export default router;
