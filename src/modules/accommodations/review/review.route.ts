import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import { reviewController } from './review.controller';

const router = Router();

router.post('/', authenticate, reviewController);

export default router;
