"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const availability_controller_1 = require("../controllers/availability.controller");
const router = (0, express_1.Router)({ mergeParams: true });
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
router.get('/', availability_controller_1.getAvailability);
exports.default = router;
