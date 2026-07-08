import { Router } from 'express';
import { rentalItemCalendarAvailability } from './rental-calendar.controller';

const router = Router({ mergeParams: true });

router.get('/', rentalItemCalendarAvailability);

export default router;
