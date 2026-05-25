import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import { userCreateBooking } from './tour-booking.controller';

const router = Router();

router.post('/', authenticate, userCreateBooking);

export default router;
