import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import { requireAdmin } from '../../../middlewares/role.middleware';
import {
  bulkOverrideCapacity,
  modifyCapacity,
  resetCapacity,
} from './capacity.controller';

const router = Router({ mergeParams: true });

// router.post('/override', authenticate, requireAdmin, overrideCapacity);
router.post('/bulk-override', authenticate, requireAdmin, bulkOverrideCapacity);

router.patch('/:id', authenticate, requireAdmin, modifyCapacity);
router.delete('/reset', authenticate, requireAdmin, resetCapacity);

export default router;
