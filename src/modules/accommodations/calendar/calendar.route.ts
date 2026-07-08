import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import { getAccommodationCalendarController } from './calendar.controller';

const router = Router({ mergeParams: true });

router.get('/', authenticate, getAccommodationCalendarController);

export default router;
