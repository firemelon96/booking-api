import { Router } from 'express';
import {
  list,
  getBySlug,
  remove,
  update,
  createFullTour,
  getById,
} from '../controllers/tour.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';

// import uploadRoutes from './upload.routes';
/**
 * @swagger
 * /api/tours:
 *   get:
 *     summary: Get all tours
 *     tags: [Tours]
 *     responses:
 *       200:
 *         description: List of tours
 */

/**
 * @swagger
 * /api/tours:
 *   post:
 *     summary: Create a tour (Admin only)
 *     tags: [Tours]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Puerto Princesa Underground River Tour
 *     responses:
 *       201:
 *         description: Tour created
 *       403:
 *         description: Forbidden
 */

/**
 * @swagger
 * /api/tours/{slug}:
 *   get:
 *     summary: Get tour by slug
 *     tags: [Tours]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tour found
 *       404:
 *         description: Tour not found
 */

const router = Router();

(router.get('/', list), router.get('/:slug', getBySlug));

export default router;
