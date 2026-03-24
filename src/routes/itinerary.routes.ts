import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';
import { addItineraryCtrl } from '../controllers/itinerary.controller';

const router = Router({ mergeParams: true });

router.post('/create', authenticate, requireAdmin, addItineraryCtrl);

export default router;
