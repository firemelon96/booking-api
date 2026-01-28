import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import * as ctrl from '../controllers/booking.controller';

const router = Router();

router.post('/', authenticate, ctrl.create);
router.get('/me', authenticate, ctrl.me);

export default router;
