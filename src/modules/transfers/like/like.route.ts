import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import {
  likeTransferController,
  unlikeTransferController,
} from './like.controller';

const router = Router({ mergeParams: true });

router.post('/', authenticate, likeTransferController);
router.delete('/', authenticate, unlikeTransferController);

export default router;
