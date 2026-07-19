import { env } from './env';

export const accessCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production', //dev only
  sameSite:
    env.NODE_ENV === 'production' ? ('none' as const) : ('lax' as const),
  path: '/',
  maxAge: 15 * 60 * 1000,
};

export const refreshCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production', //dev only
  sameSite:
    env.NODE_ENV === 'production' ? ('none' as const) : ('lax' as const),
  path: '/',
  maxAge: 30 * 24 * 60 * 60 * 1000,
};
