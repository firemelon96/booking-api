"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.likeTour = likeTour;
exports.removeLike = removeLike;
const like_service_1 = require("./like.service");
async function likeTour(req, res, next) {
    const { tourId } = req.params;
    if (!req.user) {
        throw new Error('Unauthorized');
    }
    if (Array.isArray(tourId)) {
        throw new Error('Invalid params');
    }
    try {
        await (0, like_service_1.likedTour)({ tourId, userId: req.user.userId });
        res.json({ success: true, message: 'Added to liked' });
    }
    catch (error) {
        next(error);
    }
}
async function removeLike(req, res, next) {
    const { tourId } = req.params;
    if (!req.user) {
        throw new Error('Unauthorized');
    }
    if (Array.isArray(tourId)) {
        throw new Error('Invalid params');
    }
    try {
        await (0, like_service_1.unlikeTour)({ tourId, userId: req.user.userId });
        res.json({ success: true, message: 'Remove from liked' });
    }
    catch (error) {
        next(error);
    }
}
