import { Router } from 'express';
import * as AuthController from './auth.controller';

const router = Router();

router.post('/oauth', AuthController.oauth);
router.post('/login', AuthController.login);
router.post('/register', AuthController.register);
router.get('/verify-email', AuthController.verifyEmail);
router.post('/resend-verification', AuthController.resendVerification);
router.post('/logout', AuthController.logout);
router.post('/logout-all', AuthController.logoutAllSession);
router.post('/refresh', AuthController.refreshSession);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);

export default router;
