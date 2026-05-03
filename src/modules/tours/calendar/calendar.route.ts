import { Router } from 'express';
import { getCalendarAvailability } from './calendar.controller';

const router = Router({ mergeParams: true });

router.get('/', getCalendarAvailability);

export default router;
