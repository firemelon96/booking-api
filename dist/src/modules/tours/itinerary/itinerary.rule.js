"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateItineraryRules = validateItineraryRules;
function validateItineraryRules(type, itinerary, duration) {
    if (!itinerary) {
        throw new Error('Itinerary is required');
    }
    if (type === 'DAY') {
        if (itinerary.length > 1) {
            throw new Error('Invalid number of itinerary for day tour');
        }
    }
    if (type === 'PACKAGE') {
        if (itinerary.length <= 1) {
            throw new Error('Invalid number of itinerary for package tour');
        }
        if (itinerary.length !== duration) {
            throw new Error('Cannot exceed the duration');
        }
    }
}
