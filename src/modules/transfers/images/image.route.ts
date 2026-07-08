import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import { requireAdmin } from '../../../middlewares/role.middleware';
import {
  setFeaturedController,
  updateImagesController,
} from './image.controller';

const router = Router({ mergeParams: true });

router.post(
  '/update-image',
  authenticate,
  requireAdmin,
  updateImagesController,
);

router.patch(
  '/:imageId/set-featured',
  authenticate,
  requireAdmin,
  setFeaturedController,
);

export default router;
