"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeInterval = normalizeInterval;
exports.overlaps = overlaps;
const date_fns_1 = require("date-fns");
function normalizeInterval(start, end) {
    const s = (0, date_fns_1.startOfDay)(start);
    const e = (0, date_fns_1.startOfDay)(end ?? start);
    return { start: s, end: e };
}
function overlaps(a, b) {
    return (0, date_fns_1.areIntervalsOverlapping)(a, b, { inclusive: true });
}
