import { Router } from 'express';

import { authenticate } from '../../../middlewares/auth.middleware';
import { requireAdmin } from '../../../middlewares/role.middleware';
import { replaceImages, setFeaturedController } from './image.controller';

const router = Router({ mergeParams: true });

router.post('/replace-images', authenticate, requireAdmin, replaceImages);
router.patch(
  '/:imageId/set-featured',
  authenticate,
  requireAdmin,
  setFeaturedController,
);

export default router;
