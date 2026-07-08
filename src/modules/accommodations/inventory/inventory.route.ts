import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import { requireAdmin } from '../../../middlewares/role.middleware';
import {
  closeInventoryController,
  openInventoryController,
} from './inventory.controller';

const router = Router();

router.post('/close', authenticate, requireAdmin, closeInventoryController);
router.post('/open', authenticate, requireAdmin, openInventoryController);

export default router;
