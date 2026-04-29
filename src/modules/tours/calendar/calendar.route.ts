import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import { requireAdmin } from '../../../middlewares/role.middleware';
import { getCalendarAvailability } from './calendar.controller';

const router = Router({ mergeParams: true });

router.get('/', getCalendarAvailability);

export default router;
