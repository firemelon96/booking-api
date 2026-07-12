"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logBookingAction = logBookingAction;
async function logBookingAction({ tx, userId, role, newValue, previousValue, action, }) {
    await tx.bookingAuditLog.create({
        data: {
            action,
            actorId: userId,
            actorType: role,
            newValue,
            previousValue: previousValue ?? null,
            timestamp: new Date(),
            bookingId: newValue.id,
        },
    });
}
