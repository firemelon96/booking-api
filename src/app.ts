import cors from 'cors';
import express from 'express';

import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

import authRoutes from './routes/auth.routes';
import tourRoutes from './modules/tours/tour.routes';
import pricingRoutes from './routes/pricing.routes';
import userRoutes from './routes/user.routes';
import bookingRoutes from './routes/booking.routes';
import uploadRoutes from './routes/upload.routes';
import adminRoutes from './routes/admin.routes';
import availabilityRoutes from './routes/availability.routes';
import paymentRoutes from './routes/payment.routes';
import webhookRoutes from './routes/webhook.routes';
import path from 'path';
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

//authorized routes
app.use('/api/me', userRoutes);

//admin routes
// app.use('/api/admin', adminRoutes);

app.use('/api/pricing', pricingRoutes);

app.use('/api/bookings', bookingRoutes);

// app.use('/api/upload', uploadRoutes);
app.use('/api/payments', paymentRoutes);

app.use('/api/webhook', webhookRoutes);
app.use('/api/availability', availabilityRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(errorHandler);

export default app;
