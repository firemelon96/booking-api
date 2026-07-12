"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calendarAvailability = calendarAvailability;
const date_fns_1 = require("date-fns");
const helper_1 = require("../../../utils/helper");
const prisma_1 = require("../../../config/prisma");
const tour_query_1 = require("../tour.query");
async function calendarAvailability({ slug, month, scheduleId, }) {
    const tour = await (0, tour_query_1.getTourIdBySlug)(slug);
    const { start, end } = (0, helper_1.getMonthRange)(month);
    const days = (0, date_fns_1.eachDayOfInterval)({ start, end });
    if (tour.hasSchedule && !scheduleId) {
        throw new Error('Schedule must be selected');
    }
    if (!tour.hasSchedule && scheduleId) {
        throw new Error('Schedule not required');
    }
    return prisma_1.prisma.$transaction(async (tx) => {
        //capacity source of truth
        const capacities = await tx.tourDailyCapacity.findMany({
            where: {
                tourId: tour.id,
                scheduleId,
                date: { gte: start, lte: end },
            },
            select: {
                date: true,
                capacitySlots: true,
                bookedSlots: true,
            },
        });
        //admin overrides
        const availability = await tx.tourAvailability.findMany({
            where: {
                tourId: tour.id,
                date: { gte: start, lte: end },
            },
            select: {
                date: true,
                isClosed: true,
            },
        });
        //maps for 0(1)
        const capacityMap = new Map(capacities.map((c) => [(0, date_fns_1.startOfDay)(c.date).getTime(), c]));
        const availabilityMap = new Map(availability.map((a) => [(0, date_fns_1.startOfDay)(a.date).getTime(), a]));
        //build response
        return days.map((day) => {
            const key = (0, date_fns_1.startOfDay)(day).getTime();
            const capacityRow = capacityMap.get(key);
            const availabilityRow = availabilityMap.get(key);
            let status;
            let capacity = 0;
            let booked = 0;
            let remainingSlots = null;
            if (availabilityRow?.isClosed) {
                status = 'CLOSED';
                return {
                    date: day.toISOString().slice(0, 10),
                    status,
                    remainingSlots: null,
                    capacity: 0,
                    booked: 0,
                };
            }
            if (capacityRow) {
                if (capacityRow.bookedSlots >= capacityRow.capacitySlots) {
                    status = 'FULL';
                    capacity = capacityRow.capacitySlots;
                    booked = capacityRow.bookedSlots;
                }
                else {
                    status = 'AVAILABLE';
                    capacity = capacityRow.capacitySlots;
                    booked = capacityRow.bookedSlots;
                    remainingSlots = capacityRow.capacitySlots - capacityRow.bookedSlots;
                }
            }
            else {
                status = 'NO_CAPACITY';
            }
            return {
                date: day.toISOString().slice(0, 10),
                status,
                remainingSlots: remainingSlots,
                capacity,
                booked,
            };
        });
    });
}
