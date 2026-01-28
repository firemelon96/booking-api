import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { error } from 'node:console';

interface JwtPayLoad {
  userId: string;
  role: 'USER' | 'ADMIN';
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).json({ error: 'Missing token' });
  }

  const token = header.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Invalid token format' });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayLoad;
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
