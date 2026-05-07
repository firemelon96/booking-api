import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireAdmin } from '../../middlewares/role.middleware';
import { getAllUser, profile } from './user.controller';

const router = Router();

router.get('/', authenticate, requireAdmin, getAllUser);
router.get('/me', authenticate, profile);

export default router;
