import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import * as ctrl from '../controllers/booking.controller';
import { requireAdmin } from '../middlewares/role.middleware';

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

router.post('/create', authenticate, ctrl.create);
router.get('/my-bookings', authenticate, ctrl.myBookings);
router.get('/all-bookings', authenticate, requireAdmin, ctrl.adminGetBookings);
router.patch('/:bookingId/reschedule', authenticate, ctrl.reschedule);
router.get('/:bookingId', authenticate, ctrl.getBookingDetails);

export default router;
