import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import { requireAdmin } from '../../../middlewares/role.middleware';
import { replaceItinerary } from './itinerary.controller';

export { Router } from 'express';

const router = Router({ mergeParams: true });

router.put('/', authenticate, requireAdmin, replaceItinerary);

export default router;
