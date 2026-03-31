import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';
import { getUsers, getUser, setProfile } from '../controllers/user.controller';

const router = Router();

router.get('/', authenticate, requireAdmin, getUsers);
router.get('/:id', authenticate, requireAdmin, getUser);
router.patch('/:id/profile-image', authenticate, setProfile);

export default router;
