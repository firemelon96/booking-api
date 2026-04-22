import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';
import {
  adminGetAllTours,
  blockDatesController,
  bulkCapacityController,
  getAdminBookingsController,
  setCapacityController,
} from '../controllers/admin.controller';
import {
  createFullTour,
  getById,
  remove,
  update,
} from '../controllers/tour.controller';
import tourPricingRoutes from './tourPricing.routes';
import availabilityRoutes from './availability.routes';
import imageRoutes from './image.routes';
import itineraryRoutes from './itinerary.routes';

const router = Router();

//tours
router.get('/tours', authenticate, requireAdmin, adminGetAllTours);
router.post('/tours', authenticate, requireAdmin, createFullTour);
router.get('/tours/:id', authenticate, requireAdmin, getById);
router.patch('/tours/:id', authenticate, requireAdmin, update);
router.delete('/tours/:id', authenticate, requireAdmin, remove);

router.use('/tours/:tourId/featured', imageRoutes);
router.use('/tours/:tourId/pricing', tourPricingRoutes);
router.use('/tours/:tourId/itinerary', itineraryRoutes);

// router.use('/:tourId/availability', availabilityRoutes);

//capacity
router.post('/capacity', authenticate, requireAdmin, setCapacityController);
router.post(
  '/capacity/bulk',
  authenticate,
  requireAdmin,
  bulkCapacityController,
);
router.post(
  '/capacity/block',
  authenticate,
  requireAdmin,
  blockDatesController,
);

router.get('/bookings', authenticate, requireAdmin, getAdminBookingsController);

export default router;
