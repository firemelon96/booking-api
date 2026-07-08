"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAvailability = checkAvailability;
const admin_warning_service_1 = require("../../logs/admin-warning.service");
async function checkAvailability({ tx, tourId, dates, role, userId, }) {
    const closedDates = await tx.tourAvailability.findMany({
        where: {
            tourId,
            date: { in: dates },
            isClosed: true,
        },
    });
    if (closedDates.length === 0)
        return;
    if (role === 'USER') {
        throw new Error('One or more dates are blocked');
    }
    for (const entry of closedDates) {
        await (0, admin_warning_service_1.logAdminWarning)({
            tx,
            actionType: 'BOOKED_ON_CLOSED_DATE',
            message: `Admin booked on closed date ${entry.date.toISOString()}`,
            tourId,
            actorId: userId,
            metadata: {
                date: entry.date,
            },
        });
    }
}
