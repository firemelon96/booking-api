import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import { requireAdmin } from '../../../middlewares/role.middleware';
import {
  createUnit,
  getUnits,
  removeUnit,
  updateUnit,
} from './units.controller';

const router = Router({ mergeParams: true });

router.post('/', authenticate, requireAdmin, createUnit);
router.patch('/:unitId', authenticate, requireAdmin, updateUnit);
router.get('/', authenticate, requireAdmin, getUnits);
router.delete('/:unitId', authenticate, requireAdmin, removeUnit);

export default router;
