import { JwtPayLoad } from '../middlewares/auth.middleware';

export {};

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayLoad;
    }
  }
}
