import { NextFunction, Request, Response } from 'express';

jest.mock('../src/middleware/auth', () => ({
  authenticate: (req: Request, res: Response, next: NextFunction) => {
    req.user = {
      userId: 'user_1',
      role: 'USER',
    };
    next();
  },
}));
