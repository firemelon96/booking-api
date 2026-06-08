import { Router } from 'express';
import { rentalItemCalendarAvailability } from './rental-calendar.controller';

const router = Router({ mergeParams: true });

router.get('/calendar', rentalItemCalendarAvailability);

export default router;
