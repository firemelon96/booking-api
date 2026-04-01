"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setFeatured = setFeatured;
const image_service_1 = require("../services/image.service");
async function setFeatured(req, res) {
    try {
        const { tourId, imageId } = req.params;
        if (Array.isArray(tourId) || Array.isArray(imageId)) {
            throw new Error('Invalid params');
        }
        const result = await (0, image_service_1.setFeaturedImage)(tourId, imageId);
        res.json(result);
    }
    catch (err) {
        res.status(404).json({ error: err.message });
    }
}
