export const accessCookieOptions = {
  httpOnly: true,
  secure: false, //dev only
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 15 * 60 * 1000,
};

export const refreshCookieOptions = {
  httpOnly: true,
  secure: false, //dev only
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 30 * 24 * 60 * 60 * 1000,
};
