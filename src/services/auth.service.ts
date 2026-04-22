import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { prisma } from '../config/prisma';
import { generateRefreshToken, hashToken } from '../config/crypto';
import { signAccessToken } from './token.service';
import { createSession } from './session.service';
import { mockVerifyOAuth } from '../config/mock-oauth';
import {
  verifyAppleToken,
  verifyGithubToken,
  verifyGoogleToken,
} from '../config/oauth';
import { sendResetPasswordEmail } from './email.service';

export async function oauthVerifier({
  provider,
  token,
}: {
  provider: string;
  token: string;
}) {
  if (process.env.MOCK_OAUTH === 'true') {
    return mockVerifyOAuth(token, provider);
  }

  if (provider === 'google') return verifyGoogleToken(token);
  if (provider === 'apple') return verifyAppleToken(token);
  if (provider === 'github') return verifyGithubToken(token);

  throw new Error('Invalid provider');
}

export async function oauthLogin({
  email,
  provider,
  providerAccountId,
}: {
  email: string;
  provider: string;
  providerAccountId: string;
}) {
  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    user = await prisma.user.create({
      data: { email },
    });
  }

  await prisma.account.upsert({
    where: {
      provider_providerAccountId: {
        provider,
        providerAccountId,
      },
    },
    create: {
      userId: user.id,
      provider,
      providerAccountId,
    },
    update: {},
  });

  return user;
}

export async function register(email: string, password: string) {
  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { email, password: hashed },
    select: { email: true, role: true },
  });

  return user;
}

export async function login(
  email: string,
  password: string,
  meta: { ip?: string; userAgent?: string },
) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.password) {
    throw new Error('Invalid credentials');
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error('Invalid credentials');

  const accessToken = signAccessToken({
    userId: user.id,
    role: user.role,
  });

  const refreshToken = generateRefreshToken();

  await createSession({
    userId: user.id,
    refreshToken,
    ip: meta.ip,
    userAgent: meta.userAgent,
  });

  return { user, accessToken, refreshToken };
}

export async function logout(refreshToken: string) {
  const hashed = hashToken(refreshToken);
  return prisma.session.deleteMany({
    where: { refreshToken: hashed },
  });
}

export async function logoutAllSession(userId: string) {
  return prisma.session.deleteMany({
    where: { userId },
  });
}

export async function refreshSession(oldRefreshToken: string) {
  const hashed = hashToken(oldRefreshToken);

  const session = await prisma.session.findUnique({
    where: { refreshToken: hashed },
    include: { user: true },
  });

  if (!session) throw new Error('Invalid session');
  if (session.expiresAt < new Date()) throw new Error('Session expired');

  await prisma.session.delete({ where: { id: session.id } });

  const newAccessToken = signAccessToken({
    userId: session.user.id,
    role: session.user.role,
  });

  const newRefreshToken = generateRefreshToken();

  await prisma.session.create({
    data: {
      userId: session.user.id,
      refreshToken: hashToken(newAccessToken),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      ip: session.ip,
      userAgent: session.userAgent,
    },
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) return;

  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token: hashedToken,
      expiresAt: new Date(Date.now() + 1000 * 60 * 30),
    },
  });

  await sendResetPasswordEmail(user.email, rawToken);

  return rawToken;
}

export async function resetPassword(token: string, newPassword: string) {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token: hashedToken },
  });

  if (!resetToken || resetToken.expiresAt < new Date()) {
    throw new Error('Invalid or expired token');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: {
      id: resetToken.userId,
    },
    data: {
      password: hashedPassword,
    },
  });

  await prisma.session.deleteMany({
    where: {
      userId: resetToken.userId,
    },
  });

  await prisma.passwordResetToken.delete({
    where: { id: resetToken.id },
  });
}
