import { Router } from 'express';

import { authenticate } from '../../../middlewares/auth.middleware';
import { requireAdmin } from '../../../middlewares/role.middleware';
import { replaceImages } from './image.controller';

const router = Router({ mergeParams: true });

router.post('/replace-images', authenticate, requireAdmin, replaceImages);

export default router;
