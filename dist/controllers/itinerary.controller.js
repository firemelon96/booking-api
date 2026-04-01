"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addItineraryCtrl = addItineraryCtrl;
const itinerary_schema_1 = require("../validators/itinerary.schema");
const itinerary_service_1 = require("../services/itinerary.service");
async function addItineraryCtrl(req, res) {
    try {
        const { tourId } = req.params;
        if (Array.isArray(tourId)) {
            throw new Error('Invalid id params');
        }
        const body = itinerary_schema_1.createItinerarySchema.parse(req.body);
        const create = await (0, itinerary_service_1.addItinerary)({
            tourId,
            ...body,
        });
        res.status(201).json(create);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}
