import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import { requireAdmin } from '../../../middlewares/role.middleware';
import { blockDates } from './availability.controller';
import { unblockDates } from './availability.controller';

const router = Router({ mergeParams: true });

router.post('/block', authenticate, requireAdmin, blockDates);
router.post('/unblock', authenticate, requireAdmin, unblockDates);

export default router;
