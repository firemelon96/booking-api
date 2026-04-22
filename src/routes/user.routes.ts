import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';
import { setProfile, getProfileDetail } from '../controllers/user.controller';
import bookingRoutes from '../routes/booking.routes';

const router = Router();

router.get('/', authenticate, getProfileDetail);
router.patch('/:id/profile-image', authenticate, setProfile);

//bookings
router.use('/bookings', bookingRoutes);

export default router;
