import z from 'zod';
import {
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  sendEmailSchema,
  verifyEmailSchema,
} from './auth.validator';

export type LoginInputType = z.infer<typeof loginSchema>;

export type RegisterInputType = z.infer<typeof registerSchema>;

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export type SendEmailInputType = z.infer<typeof sendEmailSchema>;

export type ResetPasswordInputType = z.infer<typeof resetPasswordSchema>;
