import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import { likeTour, removeLike } from './like.controller';

const router = Router({ mergeParams: true });

router.post('/', authenticate, likeTour);
router.delete('/', authenticate, removeLike);

export default router;
