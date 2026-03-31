import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { xenditWebhook } from '../controllers/webhook.controller';

const router = Router();

router.post('/xendit', authenticate, xenditWebhook);

export default router;
