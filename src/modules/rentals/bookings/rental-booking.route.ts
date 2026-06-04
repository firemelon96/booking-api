import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import { createRentalBookingController } from './rental-booking.controller';

const router = Router({ mergeParams: true });

router.post('/', authenticate, createRentalBookingController);

export default router;
