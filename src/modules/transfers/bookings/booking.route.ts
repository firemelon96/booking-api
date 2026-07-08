import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import { createTransferBookingController } from './booking.controller';

const router = Router({ mergeParams: true });

router.post('/', authenticate, createTransferBookingController);

export default router;
