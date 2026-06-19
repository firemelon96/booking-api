import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import { requireAdmin } from '../../../middlewares/role.middleware';

const router = Router({ mergeParams: true });

router.post('/set-inventory', authenticate, requireAdmin);

export default router;
