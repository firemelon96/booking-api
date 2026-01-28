import cors from 'cors';
import express from 'express';

import authRoutes from './routes/auth.routes';
import tourRoutes from './routes/tour.routes';
import pricingRoutes from './routes/pricing.routes';
import bookingRoutes from './routes/booking.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/tours', tourRoutes);
app.use('/api/pricing', pricingRoutes);

app.use('/api/bookings', bookingRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

export default app;
