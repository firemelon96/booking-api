"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewController = reviewController;
const review_validator_1 = require("./review.validator");
const review_service_1 = require("./review.service");
const accommodation_booking_validator_1 = require("../booking/accommodation-booking.validator");
async function reviewController(req, res, next) {
    if (!req.user) {
        throw new Error('Unauthorized');
    }
    const params = accommodation_booking_validator_1.accommodationIdParams.safeParse(req.params);
    if (!params.success) {
        throw new Error('Invalid fields');
    }
    const payload = review_validator_1.createReviewSchema.safeParse(req.body);
    if (!payload.success) {
        throw new Error('Invalid fields');
    }
    try {
        const created = await (0, review_service_1.addReviewService)(req.user.userId, params.data.accommodationId, payload.data);
        res.status(201).json(created);
    }
    catch (error) {
        next(error);
    }
}
