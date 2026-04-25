import express from 'express';
import cookieParser from 'cookie-parser';
import authRoutes from '../src/routes/auth.routes';

export const createTestApp = () => {
  const app = express();

  app.use(express.json());
  app.use(cookieParser());

  app.use('/auth', authRoutes);

  return app;
};
