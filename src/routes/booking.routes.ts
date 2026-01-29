import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import * as ctrl from '../controllers/booking.controller';

const router = Router();

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create a booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tourId, pricingType, participants, startDate]
 *             properties:
 *               tourId:
 *                 type: string
 *               pricingType:
 *                 type: string
 *                 enum: [joiner, private]
 *               participants:
 *                 type: number
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Booking created
 *       400:
 *         description: Booking conflict or validation error
 */

/**
 * @swagger
 * /api/bookings/me:
 *   get:
 *     summary: Get logged-in user's bookings
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of bookings
 */

router.post('/', authenticate, ctrl.create);
router.get('/me', authenticate, ctrl.me);

export default router;
