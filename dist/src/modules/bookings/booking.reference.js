"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateBookingReference = generateBookingReference;
const date_fns_1 = require("date-fns");
function randomString(length = 4) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}
function generateBookingReference() {
    const date = (0, date_fns_1.format)(new Date(), 'yyyyMMdd');
    return `BK-${date}-${randomString(4)}`;
}
