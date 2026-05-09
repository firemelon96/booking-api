import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../modules/auth/token/token.service';
import { Role } from '../generated/prisma/enums';

export interface JwtPayLoad {
  userId: string;
  role: Role;
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.accessToken;

  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = verifyAccessToken(token) as JwtPayLoad;
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
