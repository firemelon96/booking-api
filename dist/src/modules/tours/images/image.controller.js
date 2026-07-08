"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.replaceImages = replaceImages;
exports.setFeaturedController = setFeaturedController;
const images_service_1 = require("./images.service");
const tour_validator_1 = require("../tour.validator");
const image_validator_1 = require("./image.validator");
async function replaceImages(req, res, next) {
    const { existingImageIds, newImageIds } = req.body;
    const params = tour_validator_1.tourIdParams.safeParse(req.params);
    if (!params.success) {
        throw new Error('Invalid params');
    }
    try {
        await (0, images_service_1.updateTourImages)(params.data.tourId, {
            existingImageIds,
            newImageIds,
        });
        res.json({ message: 'Images updated successfully' });
    }
    catch (error) {
        next(error);
    }
}
async function setFeaturedController(req, res, next) {
    const params = image_validator_1.setFeaturedParams.safeParse(req.params);
    if (!params.success) {
        throw new Error('Invalid params');
    }
    try {
        await (0, images_service_1.setFeaturedService)(params.data);
        res.json({ message: 'Image featured set!' });
    }
    catch (error) {
        next(error);
    }
}
