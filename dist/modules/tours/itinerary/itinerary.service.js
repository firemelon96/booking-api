"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createItinerary = createItinerary;
exports.modifyItinerary = modifyItinerary;
const prisma_1 = require("../../../config/prisma");
const tour_query_1 = require("../tour.query");
const itinerary_rule_1 = require("./itinerary.rule");
async function createItinerary(tx, tourId, itinerary) {
    return tx.itinerary.create({
        data: {
            tourId,
            days: {
                create: itinerary.map((day) => ({
                    dayNumber: day.dayNumber,
                    title: day.title,
                    items: {
                        create: day.items.map((item, index) => ({
                            ...item,
                            order: index,
                        })),
                    },
                })),
            },
        },
    });
}
async function modifyItinerary(tourId, itinerary) {
    const tour = await (0, tour_query_1.findTourOrFail)(tourId);
    (0, itinerary_rule_1.validateItineraryRules)(tour.type, itinerary, tour.durationDays);
    return prisma_1.prisma.$transaction(async (tx) => {
        await tx.itinerary.deleteMany({ where: { tourId: tour.id } });
        await tx.itinerary.create({
            data: {
                tourId: tour.id,
                days: {
                    create: itinerary.map((day) => ({
                        dayNumber: day.dayNumber,
                        title: day.title,
                        items: {
                            create: day.items.map((item, index) => ({
                                ...item,
                                order: index,
                            })),
                        },
                    })),
                },
            },
        });
        return { success: true, message: 'Updated itinerary' };
    });
}
