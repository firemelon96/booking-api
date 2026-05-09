import { NextFunction, Request, Response } from 'express';
// import { requireAdmin } from '../../src/middlewares/role.middleware';
// import { authenticate } from '../../src/middlewares/auth.middleware';

jest.mock('../../src/middlewares/auth.middleware', () => ({
  authenticate: (req: Request, res: Response, next: NextFunction) => {
    req.user = {
      userId: '00000000-0000-0000-0000-000000000001',
      role: 'ADMIN',
    };
    next();
  },
}));
