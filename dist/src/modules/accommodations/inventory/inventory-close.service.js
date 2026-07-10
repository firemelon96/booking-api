"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeInventoryService = closeInventoryService;
exports.openInventoryService = openInventoryService;
const date_fns_1 = require("date-fns");
const accommodation_query_1 = require("../accommodation.query");
const helper_1 = require("../../../utils/helper");
const prisma_1 = require("../../../config/prisma");
const inventory_service_1 = require("./inventory.service");
const units_query_1 = require("../unit/units.query");
async function closeInventoryService(accommodationId, { endDate, startDate, unitId }) {
    const accommodation = await (0, accommodation_query_1.findAccommodationOrFail)(accommodationId);
    if (accommodation.hasUnits && !unitId) {
        throw new Error('Requires unit');
    }
    if (!accommodation.hasUnits && unitId) {
        throw new Error('Accommodation does not have unit');
    }
    const interval = (0, helper_1.normalizeInterval)(startDate, endDate);
    const dates = (0, date_fns_1.eachDayOfInterval)(interval);
    return prisma_1.prisma.$transaction(async (tx) => {
        if (unitId) {
            await (0, inventory_service_1.ensureUnitInventoryRows)(tx, { unitId, dates, quantity: 0 });
            await tx.accommodationUnitInventory.updateMany({
                where: {
                    unitId,
                    date: {
                        gte: interval.start,
                        lte: interval.end,
                    },
                },
                data: {
                    isClosed: true,
                },
            });
        }
        else {
            await (0, inventory_service_1.ensureAccommodationInventoryRows)(tx, { accommodationId, dates });
            await tx.accommodationInventory.updateMany({
                where: {
                    accommodationId,
                    date: {
                        gte: interval.start,
                        lte: interval.end,
                    },
                },
                data: {
                    isClosed: true,
                },
            });
        }
        return { success: true, blockDates: dates.length };
    });
}
async function openInventoryService(accommodationId, { endDate, startDate, unitId }) {
    const accommodation = await (0, accommodation_query_1.findAccommodationOrFail)(accommodationId);
    if (accommodation.hasUnits && !unitId) {
        throw new Error('Requires unit');
    }
    if (!accommodation.hasUnits && unitId) {
        throw new Error('Accommodation does not have unit');
    }
    const interval = (0, helper_1.normalizeInterval)(startDate, endDate);
    const dates = (0, date_fns_1.eachDayOfInterval)(interval);
    return prisma_1.prisma.$transaction(async (tx) => {
        if (unitId) {
            const unit = await (0, units_query_1.findUnitOrFail)(unitId);
            await (0, inventory_service_1.ensureUnitInventoryRows)(tx, {
                unitId,
                dates,
                quantity: unit.quantity,
            });
            await tx.accommodationUnitInventory.updateMany({
                where: {
                    unitId,
                    date: {
                        gte: interval.start,
                        lte: interval.end,
                    },
                },
                data: {
                    isClosed: false,
                },
            });
        }
        else {
            await (0, inventory_service_1.ensureAccommodationInventoryRows)(tx, { accommodationId, dates });
            await tx.accommodationInventory.updateMany({
                where: {
                    accommodationId,
                    date: {
                        gte: interval.start,
                        lte: interval.end,
                    },
                },
                data: {
                    isClosed: false,
                },
            });
        }
        return { success: true };
    });
}
