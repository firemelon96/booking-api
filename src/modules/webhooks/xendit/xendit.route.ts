import { Router } from 'express';
import { xenditWebhook } from './xendit.controller';

const router = Router();

router.post('/', xenditWebhook);

export default router;
