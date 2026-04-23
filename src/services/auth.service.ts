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
import { sendResetPasswordEmail, sendVerificationEmail } from './email.service';

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
  emailVerified,
}: {
  email: string;
  provider: string;
  providerAccountId: string;
  emailVerified: boolean;
}) {
  if (!emailVerified) {
    throw new Error('Oauth email not verified');
  }

  const existingAccount = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider,
        providerAccountId,
      },
    },
    include: {
      user: true,
    },
  });

  if (existingAccount) return existingAccount.user;

  let user = await prisma.user.findUnique({ where: { email } });

  //TODO: skip email verification if provider is provided

  if (!user) {
    user = await prisma.user.create({
      data: { email, emailVerified: true },
    });
  }

  if (user && !user.emailVerified) {
    user = await prisma.user.update({
      where: { email },
      data: { emailVerified: true },
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
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { email, password: hashedPassword },
    select: { id: true, email: true, role: true },
  });

  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashed = hashToken(rawToken);

  await prisma.emailVerificationToken.create({
    data: {
      userId: user.id,
      token: hashed,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    },
  });

  //send email
  await sendVerificationEmail(user.email, rawToken);

  return user;
}

export async function resendVerification(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.emailVerified) return;

  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashed = hashToken(rawToken);

  await prisma.emailVerificationToken.create({
    data: {
      userId: user.id,
      token: hashed,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    },
  });

  await sendVerificationEmail(user.email, rawToken);
}

export async function verifyEmail(token: string) {
  const hashed = hashToken(token);

  const record = await prisma.emailVerificationToken.findUnique({
    where: { token: hashed },
  });

  if (!record || record.expiresAt < new Date()) {
    throw new Error('Invalid or expired token');
  }

  await prisma.user.update({
    where: {
      id: record.userId,
    },
    data: { emailVerified: true },
  });

  await prisma.emailVerificationToken.delete({
    where: { id: record.id },
  });

  return true;
}

export async function login(
  email: string,
  password: string,
  meta: { ip?: string; userAgent?: string },
) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user?.emailVerified) {
    throw new Error('Please verify your email before logging in');
  }

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
