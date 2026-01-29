import { Router } from 'express';
import { calculatePricing } from '../controllers/pricing.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/pricing/calculate:
 *   post:
 *     summary: Calculate booking price
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tourId, pricingType, participants]
 *             properties:
 *               tourId:
 *                 type: string
 *               pricingType:
 *                 type: string
 *                 enum: [joiner, private]
 *               participants:
 *                 type: number
 *     responses:
 *       200:
 *         description: Price calculated
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     PricingConflictRules:
 *       type: object
 *       description: Rules enforced when creating or updating tour pricing
 *       properties:
 *         pricingType:
 *           type: string
 *           description: Pricing rules only conflict within the same pricingType (joiner or private)
 *         groupSizeOverlap:
 *           type: string
 *           description: >
 *             Group size ranges must not overlap.
 *             Example: (1–4) conflicts with (3–6), but not with (5–8).
 *         example:
 *           type: string
 *           example: |
 *             Existing pricing: private 1–4
 *             New pricing: private 3–6 ❌ (overlap)
 *             New pricing: private 5–8 ✅ (allowed)
 */

router.post('/calculate', authenticate, calculatePricing);

export default router;
