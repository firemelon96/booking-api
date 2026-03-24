import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';
import { getUsers, getUser } from '../controllers/user.controller';

const router = Router();

router.get('/', authenticate, requireAdmin, getUsers);
router.get('/:id', authenticate, requireAdmin, getUser);

export default router;
