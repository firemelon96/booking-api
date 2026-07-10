"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAdminWarning = logAdminWarning;
async function logAdminWarning({ tx, actionType, actorId, message, metadata, tourId, bookingId, unitId, accommodationId, transferId, rentalId, }) {
    return tx.adminWarningLog.create({
        data: {
            actionType,
            unitId,
            accommodationId,
            actorId,
            message,
            metadata,
            tourId,
            bookingId,
            transferId,
            rentalId,
        },
    });
}
