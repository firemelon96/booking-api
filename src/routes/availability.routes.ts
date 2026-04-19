import { Router } from 'express';
import {
  availability,
  getAvailability,
} from '../controllers/availability.controller';
import { getCalendarAvailability } from '../services/availability.service';

const router = Router({ mergeParams: true });

/**
 * @swagger
 * /api/tours/{tourId}/availability:
 *   get:
 *     summary: Get availability for a tour (calendar UI)
 *     tags: [Availability]
 *     parameters:
 *       - in: path
 *         name: tourId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: start
 *         required: true
 *         schema:
 *           type: string
 *           example: 2026-02-01
 *       - in: query
 *         name: end
 *         required: true
 *         schema:
 *           type: string
 *           example: 2026-02-28
 *     responses:
 *       200:
 *         description: Availability per day
 */

// router.get('/', getAvailability);

router.get('/calendar', availability);

export default router;
