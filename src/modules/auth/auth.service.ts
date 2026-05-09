import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { prisma } from '../../config/prisma';
import { checkVerifiedUserEmail } from './auth.query';
import { signAccessToken } from './token/token.service';
import { generateRefreshToken, hashToken } from '../../config/crypto';
import {
  LoginInputType,
  RegisterInputType,
  ResetPasswordInputType,
  SendEmailInputType,
  VerifyEmailInput,
} from './auth.type';
import {
  sendResetPasswordEmail,
  sendVerificationEmail,
} from './email/email.service';

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

  let user;

  if (existingAccount) {
    user = existingAccount.user;
  } else {
    user = await prisma.user.findUnique({ where: { email } });

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
  }

  const accessToken = signAccessToken({
    userId: user.id,
    role: user.role,
  });

  const refreshToken = generateRefreshToken();

  return { user, accessToken, refreshToken };
}

export async function login({ email, password }: LoginInputType) {
  const user = await checkVerifiedUserEmail(email);

  if (!user.password) {
    // const hashedPassword = await bcrypt.hash(password, 10);

    // await prisma.user.update({
    //   where: { id: user.id },
    //   data: { password: hashedPassword },
    // });
    throw new Error('Invalid credentials');
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    throw new Error('Invalid credentials');
  }

  const accessToken = signAccessToken({
    userId: user.id,
    role: user.role,
  });

  const refreshToken = generateRefreshToken();

  return { user, accessToken, refreshToken };
}

export async function register({ email, password }: RegisterInputType) {
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

  await sendVerificationEmail(email, rawToken);

  return user;
}

export async function verifyEmail({ token }: VerifyEmailInput) {
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
    data: {
      emailVerified: true,
    },
  });

  await prisma.emailVerificationToken.delete({
    where: { id: record.id },
  });

  return true;
}

export async function resendVerification({ email }: SendEmailInputType) {
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

export async function forgotPassword({ email }: SendEmailInputType) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) return;

  const rawToken = crypto.randomBytes(32).toString('hex');

  const hashedToken = hashToken(rawToken);

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

export async function resetPassword({
  token,
  newPassword,
}: ResetPasswordInputType) {
  const hashedToken = hashToken(token);

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
