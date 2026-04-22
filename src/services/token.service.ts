import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { Role } from '../generated/prisma/enums';

export function signAccessToken(payload: { userId: string; role: Role }) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '15m' });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET);
}
