import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import { requireAdmin } from '../../../middlewares/role.middleware';
import {
  createPolicy,
  deletePolicy,
  modifyPolicy,
} from './cancellation.controller';

const router = Router({ mergeParams: true });

router.post('/', authenticate, requireAdmin, createPolicy);
router.patch('/', authenticate, requireAdmin, modifyPolicy);
router.delete('/delete', authenticate, requireAdmin, deletePolicy);

export default router;
