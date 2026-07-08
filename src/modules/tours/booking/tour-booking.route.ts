import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import { userCreateBooking } from './tour-booking.controller';

const router = Router({ mergeParams: true });

router.post('/', authenticate, userCreateBooking);

export default router;
