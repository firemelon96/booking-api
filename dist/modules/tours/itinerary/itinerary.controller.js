"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.replaceItinerary = replaceItinerary;
const itinerary_validator_1 = require("./itinerary.validator");
const itinerary_service_1 = require("./itinerary.service");
const tour_validator_1 = require("../tour.validator");
async function replaceItinerary(req, res) {
    const params = tour_validator_1.tourIdParams.safeParse(req.params);
    const payload = itinerary_validator_1.daysSchema.safeParse(req.body);
    if (!params.success) {
        throw new Error('Invalid params');
    }
    if (!payload.success) {
        throw new Error('Invalid fields');
    }
    try {
        const replaced = await (0, itinerary_service_1.modifyItinerary)(params.data.tourId, payload.data);
        res.json(replaced);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}
