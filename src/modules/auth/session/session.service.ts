import { prisma } from '../../../config/prisma';
import { generateRefreshToken, hashToken } from '../../../config/crypto';
import { signAccessToken } from '../token/token.service';

export async function createSession({
  userId,
  refreshToken,
  userAgent,
  ip,
}: {
  userId: string;
  refreshToken: string;
  userAgent?: string;
  ip?: string;
}) {
  const hashed = hashToken(refreshToken);

  return prisma.session.create({
    data: {
      userId,
      refreshToken: hashed,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      ip,
      userAgent,
    },
  });
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

  if (!session) {
    throw new Error('Invalid session');
  }

  if (session.expiresAt < new Date()) {
    throw new Error('Session expired');
  }

  await prisma.session.delete({ where: { id: session.id } });

  const newAccessToken = signAccessToken({
    userId: session.user.id,
    role: session.user.role,
  });

  const newRefreshToken = generateRefreshToken();

  return {
    session,
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}
