import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import { requireAdmin } from '../../../middlewares/role.middleware';
import { getTransferCalendarController } from './transfer-calendar.controller';

const router = Router({ mergeParams: true });

router.get('/', authenticate, requireAdmin, getTransferCalendarController);

export default router;
