//Google verification
import axios from 'axios';
import jwt from 'jsonwebtoken';

export async function verifyGoogleToken(idToken: string) {
  const res = await axios.get(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`,
  );

  //TODO: add return type chheck for email verified by provider

  return {
    email: res.data.email,
    providerAccountId: res.data.sub,
    emailVerified: res.data.email_verified,
  };
}

export async function verifyAppleToken(identityToken: string) {
  const decoded = jwt.decode(identityToken) as any;

  if (!decoded?.email) throw new Error('Invalid Apple token');

  return {
    email: decoded.email,
    providerAccountId: decoded.sub,
    emailVerified: decoded.verified,
  };
}

export async function verifyGithubToken(accessToken: string) {
  const res = await axios.get('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return {
    email: res.data.email,
    providerAccountId: res.data.id.toString(),
    emailVerified: false,
  };
}
