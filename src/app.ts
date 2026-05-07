import path from 'path';
import cors from 'cors';
import express from 'express';

import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

import authRoutes from './modules/auth/auth.routes';
import tourRoutes from './modules/tours/tour.routes';
import bookingRoutes from './modules/bookings/booking.route';
import webhookRoutes from './modules/webhooks/xendit/xendit.route';
import userRoutes from './modules/users/user.route';
// import paymentRoutes from './routes/payment.routes';
import passport from './config/passport';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middlewares/error.middleware';

const app = express();

app.set('trust proxy', 1);

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

//auth routes i.e. login, register
app.use('/api/auth', authRoutes);

//public routes
app.use('/api/tours', tourRoutes);

app.use('/api/bookings', bookingRoutes);
//authorized routes
app.use('/api/users', userRoutes);

app.use('/api/webhook', webhookRoutes);

//admin routes
// app.use('/api/admin', adminRoutes);

// app.use('/api/upload', uploadRoutes);
// app.use('/api/payments', paymentRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(errorHandler);

export default app;
