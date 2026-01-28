import { Router } from 'express';
import { getAvailability } from '../controllers/availability.controller';

const router = Router({ mergeParams: true });

router.get('/', getAvailability);

export default router;
