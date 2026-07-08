import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import { requireAdmin } from '../../../middlewares/role.middleware';
import { modifyScheduleController } from '../schedules/schedule.controller';

const router = Router({ mergeParams: true });

router.post('/', authenticate, requireAdmin, modifyScheduleController);

export default router;
