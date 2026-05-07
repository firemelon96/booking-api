import { Request, Response, NextFunction } from 'express';
import { oauthVerifier } from './auth.query';
import * as AuthService from './auth.service';
import { accessCookieOptions, refreshCookieOptions } from '../../config/cookie';
import {
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  sendEmailSchema,
  verifyEmailSchema,
} from './auth.validator';
import * as SessionService from '../auth/session/session.service';

export async function oauth(req: Request, res: Response, next: NextFunction) {
  const { provider, token } = req.body;

  const profile = await oauthVerifier({ provider, token });

  try {
    const { user, accessToken, refreshToken } = await AuthService.oauthLogin({
      email: profile?.email,
      provider,
      providerAccountId: profile?.providerAccountId,
      emailVerified: profile.emailVerified,
    });

    await SessionService.createSession({
      userId: user.id,
      refreshToken,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.cookie('accessToken', accessToken, accessCookieOptions);
    res.cookie('refreshToken', refreshToken, refreshCookieOptions);

    return res.json({ user });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  const payload = loginSchema.safeParse(req.body);

  if (!payload.success) {
    throw new Error('Invalid fields');
  }

  try {
    const { user, accessToken, refreshToken } = await AuthService.login(
      payload.data,
    );

    await SessionService.createSession({
      userId: user.id,
      refreshToken,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.cookie('accessToken', accessToken, accessCookieOptions);
    res.cookie('refreshToken', refreshToken, refreshCookieOptions);

    return res.json({ user });
  } catch (error) {
    next(error);
  }
}

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const payload = registerSchema.safeParse(req.body);

  if (!payload.success) {
    throw new Error('Invalid fields');
  }

  try {
    const user = await AuthService.register(payload.data);

    res.json({ user });
  } catch (error) {
    next(error);
  }
}

export async function verifyEmail(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const payload = verifyEmailSchema.safeParse(req.query);

  if (!payload.success) {
    throw new Error('Invalid fields');
  }

  try {
    await AuthService.verifyEmail(payload.data);
    return res.json({ success: true, message: 'Email verified, Please login' });
  } catch (error) {
    next(error);
  }
}

export async function resendVerification(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const payload = sendEmailSchema.safeParse(req.body);

  if (!payload.success) {
    throw new Error('Invalid fields');
  }

  try {
    await AuthService.resendVerification(payload.data);

    return res.json({
      success: true,
      message: 'Email sent.',
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    throw new Error('Unauthorized');
  }

  try {
    await SessionService.logout(refreshToken);

    res.clearCookie('accessToken', accessCookieOptions);
    res.clearCookie('refreshToken', refreshCookieOptions);

    return res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function logoutAllSession(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { userId } = req.body;

  try {
    await SessionService.logoutAllSession(userId);

    res.clearCookie('accessToken', accessCookieOptions);
    res.clearCookie('refreshToken', refreshCookieOptions);

    return res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function refreshSession(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const {
      session,
      accessToken,
      refreshToken: newRefreshToken,
    } = await SessionService.refreshSession(refreshToken);

    await SessionService.createSession({
      userId: session.user.id,
      refreshToken: newRefreshToken,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.cookie('accessToken', accessToken, accessCookieOptions);
    res.cookie('refreshToken', newRefreshToken, refreshCookieOptions);

    return res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const payload = sendEmailSchema.safeParse(req.body);

  if (!payload.success) {
    throw new Error('Invalid fields');
  }

  try {
    const token = await AuthService.forgotPassword(payload.data);

    return res.json({ success: true, message: token });
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const payload = resetPasswordSchema.safeParse(req.body);

  if (!payload.success) {
    throw new Error('Invalid fields');
  }

  try {
    await AuthService.resetPassword(payload.data);

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}
