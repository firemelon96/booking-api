"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkSetCapacity = bulkSetCapacity;
exports.updateCapacity = updateCapacity;
exports.deleteCapacity = deleteCapacity;
const date_fns_1 = require("date-fns");
const prisma_1 = require("../../../config/prisma");
const helper_1 = require("../../../utils/helper");
const capacity_query_1 = require("./capacity.query");
// export async function upsertCapacity({
//   tourId,
//   date,
//   scheduleId,
//   capacity,
// }: CapacityParams & { tourId: string }) {
//   const scheduleKey = scheduleId ?? 'NO_SCHEDULE';
//   return prisma.tourDailyCapacity.upsert({
//     where: {
//       tourId_date_scheduleKey: {
//         tourId: tourId,
//         date: startOfDay(new Date(date)),
//         scheduleKey,
//       },
//     },
//     update: {
//       capacity,
//     },
//     create: {
//       tourId,
//       date: startOfDay(new Date(date)),
//       scheduleId: scheduleId ?? null,
//       scheduleKey,
//       capacity,
//       booked: 0,
//     },
//   });
// }
async function bulkSetCapacity({ tourId, startDate, endDate, capacity, scheduleId, }) {
    const interval = (0, helper_1.normalizeInterval)(startDate, endDate);
    const dates = (0, date_fns_1.eachDayOfInterval)(interval);
    if (capacity < 0) {
        throw new Error('Capacity cannot be negative');
    }
    return prisma_1.prisma.$transaction(async (tx) => {
        //create missiong row
        await (0, capacity_query_1.prepareCapacity)({ tx, tourId, scheduleId, capacity, dates });
        const result = await tx.tourDailyCapacity.updateMany({
            where: {
                tourId,
                scheduleId,
                date: { gte: interval.start, lte: interval.end },
                bookedSlots: {
                    lte: capacity,
                },
            },
            data: {
                capacitySlots: capacity,
            },
        });
        const expected = dates.length;
        if (result.count !== expected) {
            throw new Error('Cannot set capacity below booked count.');
        }
        return {
            success: true,
            updatedDates: result.count,
            capacity,
        };
    });
}
async function updateCapacity({ id, capacity, }) {
    await (0, capacity_query_1.findCapacityOrFail)({ id });
    return prisma_1.prisma.tourDailyCapacity.update({
        where: {
            id,
        },
        data: {
            bookedSlots: capacity,
        },
    });
}
async function deleteCapacity({ tourId }) {
    const row = await prisma_1.prisma.tourDailyCapacity.findFirst({
        where: {
            tourId,
        },
    });
    if (!row) {
        throw new Error('Capacity not found');
    }
    if (row.bookedSlots > 0) {
        throw new Error('Cannot reset active booking');
    }
    return prisma_1.prisma.tourDailyCapacity.delete({
        where: {
            id: row.id,
        },
    });
}
