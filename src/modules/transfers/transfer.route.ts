import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireAdmin } from '../../middlewares/role.middleware';
import {
  createTransferController,
  removeTransferController,
  updateTransferController,
} from './transfer.controller';

const router = Router({ mergeParams: true });

router.post('/', authenticate, requireAdmin, createTransferController);
router.patch(
  '/:transferId',
  authenticate,
  requireAdmin,
  updateTransferController,
);
router.delete(
  '/:transferId',
  authenticate,
  requireAdmin,
  removeTransferController,
);

export default router;
