import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { env } from '../config/env';

export async function registerUser(email: string, password: string) {
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    throw new Error('Email already in use.');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { email, password: hashedPassword },
  });

  return user;
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isValid = await bcrypt.compare(password, user.password);

  if (!isValid) {
    throw new Error('Invalid credentials');
  }

  const token = jwt.sign({ userId: user.id, role: user.role }, env.JWT_SECRET, {
    expiresIn: '1d',
  });

  return { user, token };
}
