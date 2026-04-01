import { Router } from 'express';

import { xenditWebhook } from '../controllers/webhook.controller';

const router = Router();

router.post('/xendit', xenditWebhook);

export default router;
