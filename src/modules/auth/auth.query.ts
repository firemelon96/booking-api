import { mockVerifyOAuth } from '../../config/mock-oauth';
import {
  verifyAppleToken,
  verifyGithubToken,
  verifyGoogleToken,
} from '../../config/oauth';
import { prisma } from '../../config/prisma';

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

export async function checkVerifiedUserEmail(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user?.emailVerified) throw new Error('Please verify your email first');

  return user;
}
