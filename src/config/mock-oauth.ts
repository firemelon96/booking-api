export const mockVerifyOAuth = (token: string, provider: string) => {
  // token can be anything (or structured)
  const fakeId = token || 'mock-user-123';

  return {
    email: 'jamionestong@gmail.com',
    providerAccountId: `${provider}-${fakeId}`,
    emailVerified: true,
  };
};
