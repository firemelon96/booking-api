import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';
import { setFeatured } from '../controllers/image.controller';

const router = Router({ mergeParams: true });

router.patch('/:imageId', authenticate, requireAdmin, setFeatured);

export default router;
