import express from 'express';
import cookieParser from 'cookie-parser';
import authRoutes from '../src/modules/auth/auth.routes';
import tourRoutes from '../src/modules/tours/tour.routes';

export const createTestApp = () => {
  const app = express();

  app.use(express.json());
  app.use(cookieParser());

  app.use('/auth', authRoutes);
  app.use('/tour', tourRoutes);

  return app;
};
