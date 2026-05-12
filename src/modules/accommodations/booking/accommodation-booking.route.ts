import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import { createBookingController } from './accommodation-booking.controller';

const router = Router({ mergeParams: true });

router.post('/', authenticate, createBookingController);

export default router;
