import { prisma } from '../config/prisma';
import { hashToken } from '../config/crypto';

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

export async function deleteSession(refreshToken: string) {
  return prisma.session.deleteMany({
    where: {
      refreshToken: hashToken(refreshToken),
    },
  });
}

export async function deleteAllSessions(userId: string) {
  return prisma.session.deleteMany({ where: { userId } });
}
