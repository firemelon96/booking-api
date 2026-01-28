import { Request, Response } from 'express';
import { loginSchema, registerSchema } from '../validators/auth.schema';
import { loginUser, registerUser } from '../services/auth.service';
import { email } from 'zod';

export async function register(req: Request, res: Response) {
  try {
    const data = registerSchema.parse(req.body);
    const user = await registerUser(data.email, data.password);

    res.status(201).json({
      message: 'User registered successfully!',
      user: { id: user.id, email: user.email },
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const data = loginSchema.parse(req.body);
    const { user, token } = await loginUser(data.email, data.password);

    res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
}
