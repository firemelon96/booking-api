// src/types/passport.d.ts
export {};

declare global {
  namespace Express {
    interface User {
      userId: string;
      role: 'USER' | 'ADMIN';
      email?: string;
    }
  }
}
