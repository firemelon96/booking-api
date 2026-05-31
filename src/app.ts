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
import amenityRoutes from './modules/amenity/amenity.route';
import accommodationRoutes from './modules/accommodations/accommodation.route';
import transferRoutes from './modules/transfers/transfer.route';
import locationRoutes from './modules/locations/location.route';

import cookieParser from 'cookie-parser';
import { errorHandler } from './middlewares/error.middleware';

const app = express();

app.set('trust proxy', 1);

app.use(cors());
app.use(express.json());
app.use(cookieParser());

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

app.use('/api/amenity', amenityRoutes);

app.use('/api/accommodations', accommodationRoutes);

app.use('/api/transfers', transferRoutes);

app.use('/api/locations', locationRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(errorHandler);

export default app;
