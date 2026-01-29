"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const ctrl = __importStar(require("../controllers/tourPricing.controller"));
const router = (0, express_1.Router)({ mergeParams: true });
/**
 * @swagger
 * /api/tours/{tourId}/pricing:
 *   post:
 *     summary: Create pricing for a tour (Admin only)
 *     description: >
 *       Adds a pricing rule for a tour. Supports joiner or private pricing,
 *       with group size ranges and optional group pricing.
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tourId
 *         required: true
 *         schema:
 *           type: string
 *         description: Tour ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pricingType
 *               - minGroupSize
 *               - maxGroupSize
 *               - price
 *             properties:
 *               pricingType:
 *                 type: string
 *                 enum: [joiner, private]
 *                 example: private
 *               minGroupSize:
 *                 type: number
 *                 example: 1
 *               maxGroupSize:
 *                 type: number
 *                 example: 4
 *               price:
 *                 type: number
 *                 example: 4500
 *               isGroupPrice:
 *                 type: boolean
 *                 description: If true, price applies to the whole group instead of per person
 *                 example: true
 *     responses:
 *       201:
 *         description: Tour pricing created successfully
 *       400:
 *         description: Validation error or overlapping pricing range
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 */
/**
 * @swagger
 * /api/tours/{tourId}/pricing:
 *   get:
 *     summary: Get all pricing rules for a tour
 *     tags: [Pricing]
 *     parameters:
 *       - in: path
 *         name: tourId
 *         required: true
 *         schema:
 *           type: string
 *         description: Tour ID
 *     responses:
 *       200:
 *         description: List of pricing rules
 *       404:
 *         description: Tour not found
 */
/**
 * @swagger
 * /api/tours/{tourId}/pricing/{pricingId}:
 *   patch:
 *     summary: Update a tour pricing rule (Admin only)
 *     description: >
 *       Updates an existing pricing rule. Group size ranges must not overlap
 *       with other pricing rules of the same pricingType.
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tourId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: pricingId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pricingType:
 *                 type: string
 *                 enum: [joiner, private]
 *               minGroupSize:
 *                 type: number
 *                 example: 2
 *               maxGroupSize:
 *                 type: number
 *                 example: 6
 *               price:
 *                 type: number
 *                 example: 3500
 *               isGroupPrice:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Pricing updated successfully
 *       400:
 *         description: Validation error or overlapping pricing range
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 *       404:
 *         description: Pricing not found
 */
/**
 * @swagger
 * /api/tours/{tourId}/pricing/{pricingId}:
 *   delete:
 *     summary: Delete a tour pricing rule (Admin only)
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tourId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: pricingId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Pricing deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 *       404:
 *         description: Pricing not found
 */
router.get('/', ctrl.list);
router.post('/', auth_middleware_1.authenticate, role_middleware_1.requireAdmin, ctrl.create);
router.patch('/:pricingId', auth_middleware_1.authenticate, role_middleware_1.requireAdmin, ctrl.update);
router.delete('/:pricingId', auth_middleware_1.authenticate, role_middleware_1.requireAdmin, ctrl.remove);
exports.default = router;
