"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tour_controller_1 = require("../controllers/tour.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const tourPricing_routes_1 = __importDefault(require("./tourPricing.routes"));
const availability_routes_1 = __importDefault(require("./availability.routes"));
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
const router = (0, express_1.Router)();
(router.get('/', tour_controller_1.list), router.get('/:slug', tour_controller_1.getBySlug));
router.post('/', auth_middleware_1.authenticate, role_middleware_1.requireAdmin, tour_controller_1.create);
router.patch('/:id', auth_middleware_1.authenticate, role_middleware_1.requireAdmin, tour_controller_1.update);
router.delete('/:id', auth_middleware_1.authenticate, role_middleware_1.requireAdmin, tour_controller_1.remove);
router.use('/:tourId/pricing', tourPricing_routes_1.default);
router.use('/:tourId/availability', availability_routes_1.default);
exports.default = router;
