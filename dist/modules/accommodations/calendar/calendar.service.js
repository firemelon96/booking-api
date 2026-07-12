"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calendarAccommodationService = calendarAccommodationService;
const date_fns_1 = require("date-fns");
const prisma_1 = require("../../../config/prisma");
const helper_1 = require("../../../utils/helper");
const accommodation_query_1 = require("../accommodation.query");
async function calendarAccommodationService(slug, { month, accommodationId, unitId }) {
    await (0, accommodation_query_1.findAccommodationBySlug)(slug);
    const { start, end } = (0, helper_1.getMonthRange)(month);
    const days = (0, date_fns_1.eachDayOfInterval)({ start, end });
    return prisma_1.prisma.$transaction(async (tx) => {
        let results;
        if (unitId) {
            const unit = await tx.accommodationUnit.findUnique({
                where: {
                    accommodationId_slug: {
                        accommodationId,
                        slug,
                    },
                },
            });
            if (!unit) {
                throw new Error('Unit not found');
            }
            const unitInventories = await tx.accommodationUnitInventory.findMany({
                where: {
                    unitId,
                    date: { gte: start, lte: end },
                },
                select: {
                    date: true,
                    availableUnits: true,
                    bookedUnits: true,
                    isClosed: true,
                },
            });
            const unitMap = new Map(unitInventories.map((u) => [(0, date_fns_1.startOfDay)(u.date).getTime(), u]));
            results = days.map((day) => {
                const key = (0, date_fns_1.startOfDay)(day).getTime();
                const unitRow = unitMap.get(key);
                let status;
                let availableUnits = 0;
                let bookedUnits = 0;
                let remainingSlots = null;
                if (unitRow?.isClosed) {
                    status = 'CLOSED';
                    return {
                        date: day.toISOString().slice(0, 10),
                        status,
                        available: false,
                        remainingSlots: null,
                        availableUnits: 0,
                        bookedUnits: 0,
                    };
                }
                if (unitRow) {
                    availableUnits = unitRow.availableUnits;
                    bookedUnits = unitRow.bookedUnits;
                }
                else {
                    availableUnits = 0;
                    bookedUnits = 0;
                }
                if (availableUnits === 0) {
                    status = 'NO_INVENTORY';
                }
                else if (bookedUnits >= availableUnits) {
                    status = 'FULL';
                }
                else {
                    status = 'AVAILABLE';
                    remainingSlots = availableUnits - bookedUnits;
                }
                return {
                    date: day.toISOString().slice(0, 10),
                    status,
                    available: status === 'AVAILABLE',
                    remainingSlots,
                    availableUnits,
                    bookedUnits,
                };
            });
        }
        else {
            const accommodationInventories = await tx.accommodationInventory.findMany({
                where: {
                    accommodationId,
                    date: { gte: start, lte: end },
                },
                select: {
                    date: true,
                    availableUnits: true,
                    bookedUnits: true,
                    isClosed: true,
                },
            });
            const accommodationMap = new Map(accommodationInventories.map((a) => [(0, date_fns_1.startOfDay)(a.date).getTime(), a]));
            results = days.map((day) => {
                const key = (0, date_fns_1.startOfDay)(day).getTime();
                const accommodationRow = accommodationMap.get(key);
                let status;
                let availableUnits = 0;
                let bookedUnits = 0;
                let remainingSlots = null;
                if (accommodationRow?.isClosed) {
                    status = 'CLOSED';
                    return {
                        date: day.toISOString().slice(0, 10),
                        status,
                        available: false,
                        remainingSlots: null,
                        availableUnits: 0,
                        bookedUnits: 0,
                    };
                }
                if (accommodationRow) {
                    availableUnits = accommodationRow.availableUnits;
                    bookedUnits = accommodationRow.bookedUnits;
                }
                else {
                    availableUnits = 0;
                    bookedUnits = 0;
                }
                if (availableUnits === 0) {
                    status = 'NO_INVENTORY';
                }
                else if (bookedUnits >= availableUnits) {
                    status = 'FULL';
                }
                else {
                    status = 'AVAILABLE';
                    remainingSlots = availableUnits - bookedUnits;
                }
                return {
                    date: day.toISOString().slice(0, 10),
                    status,
                    available: status === 'AVAILABLE',
                    remainingSlots,
                    availableUnits,
                    bookedUnits,
                };
            });
        }
        return {
            month,
            days: results,
        };
    });
}
