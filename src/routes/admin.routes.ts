import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';
import {
  blockDatesController,
  bulkCapacityController,
  getAdminBookingsController,
  setCapacityController,
} from '../controllers/admin.controller';

const router = Router();

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
