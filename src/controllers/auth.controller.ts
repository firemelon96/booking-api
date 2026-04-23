import { Request, Response } from 'express';
import { loginSchema, registerSchema } from '../validators/auth.schema';
import * as AuthService from '../services/auth.service';
import { signAccessToken } from '../services/token.service';
import { generateRefreshToken } from '../config/crypto';
import { createSession } from '../services/session.service';
import { accessCookieOptions, refreshCookieOptions } from '../config/cookie';

export async function oauth(req: Request, res: Response) {
  const { provider, token } = req.body;

  const profile = await AuthService.oauthVerifier({ provider, token });

  const user = await AuthService.oauthLogin({
    email: profile?.email,
    provider,
    providerAccountId: profile?.providerAccountId,
    emailVerified: profile.emailVerified,
  });

  const accessToken = signAccessToken({
    userId: user.id,
    role: user.role,
  });

  const refreshToken = generateRefreshToken();

  await createSession({
    userId: user.id,
    refreshToken,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.cookie('accessToken', accessToken, accessCookieOptions);
  res.cookie('refreshToken', refreshToken, refreshCookieOptions);

  return res.json({ user });
}

export async function login(req: Request, res: Response) {
  const validateFields = loginSchema.safeParse(req.body);

  if (!validateFields.success) {
    return res.status(403).json({ error: 'Invalid fields' });
  }

  const { email, password } = validateFields.data;

  try {
    const { user, accessToken, refreshToken } = await AuthService.login(
      email,
      password,
      { ip: req.ip, userAgent: req.headers['user-agent'] },
    );

    res.cookie('accessToken', accessToken, accessCookieOptions);

    res.cookie('refreshToken', refreshToken, refreshCookieOptions);

    return res.json({ user });
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
}

export async function refreshToken(req: Request, res: Response) {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { accessToken, refreshToken: newRefreshToken } =
    await AuthService.refreshSession(refreshToken);

  res.cookie('accessToken', accessToken, accessCookieOptions);
  res.cookie('refreshToken', newRefreshToken, refreshCookieOptions);

  return res.json({ success: true });
}

export async function logout(req: Request, res: Response) {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await AuthService.logout(refreshToken);

    res.clearCookie('accessToken', accessCookieOptions);
    res.clearCookie('refreshToken', refreshCookieOptions);

    return res.json({ success: true });
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
}

export async function logoutAll(req: Request, res: Response) {
  const { userId } = req.body;
  try {
    await AuthService.logoutAllSession(userId);

    res.clearCookie('accessToken', accessCookieOptions);
    res.clearCookie('refreshToken', refreshCookieOptions);

    return res.json({ success: true });
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
}

export async function register(req: Request, res: Response) {
  const validateFields = registerSchema.safeParse(req.body);

  if (!validateFields.success) {
    return res.status(403).json({ error: 'Invalid fields' });
  }

  const { email, password } = validateFields.data;

  try {
    const user = await AuthService.register(email, password);

    return res.json({ user });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(401).json({ error: 'Email already in use' });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function verifyEmail(req: Request, res: Response) {
  const { token } = req.query;

  if (typeof token !== 'string') {
    return res.status(400).json({ error: 'Invalid token' });
  }

  try {
    await AuthService.verifyEmail(token);
    return res.json({ success: true });
  } catch (error) {
    res.status(500).json('Internal server error');
  }
}

export async function resendVerification(req: Request, res: Response) {
  const { email } = req.body;

  try {
    await AuthService.resendVerification(email);

    return res.json({
      success: true,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body;

  await AuthService.forgotPassword(email);

  return res.json({ messaage: 'Send to email' });
}

export async function resetPassword(req: Request, res: Response) {
  const { token, password } = req.body;

  await AuthService.resetPassword(token, password);

  return res.json({ success: true });
}
