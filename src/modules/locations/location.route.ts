import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireAdmin } from '../../middlewares/role.middleware';
import {
  addLocationController,
  listLocationController,
  removeLocationController,
  updateLocationController,
} from './location.controller';

const router = Router();

router.post('/', authenticate, requireAdmin, addLocationController);
router.patch(
  '/:locationId',
  authenticate,
  requireAdmin,
  updateLocationController,
);
router.delete(
  '/:locationId',
  authenticate,
  requireAdmin,
  removeLocationController,
);

router.get('/', authenticate, requireAdmin, listLocationController);

export default router;
