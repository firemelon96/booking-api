import cors from 'cors';
import express from 'express';

import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

import authRoutes from './routes/auth.routes';
import tourRoutes from './routes/tour.routes';
import pricingRoutes from './routes/pricing.routes';
import bookingRoutes from './routes/booking.routes';
import path from 'path';

const app = express();

app.set('trust proxy', 1);

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.use('/api/auth', authRoutes);
app.use('/api/tours', tourRoutes);
app.use('/api/pricing', pricingRoutes);

app.use('/api/bookings', bookingRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

export default app;
