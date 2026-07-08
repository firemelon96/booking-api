"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStayDates = getStayDates;
exports.getNightCount = getNightCount;
const date_fns_1 = require("date-fns");
function getStayDates({ checkIn, checkOut, }) {
    return (0, date_fns_1.eachDayOfInterval)({
        start: (0, date_fns_1.startOfDay)(checkIn),
        // checkout date is NOT occupied
        end: (0, date_fns_1.subDays)((0, date_fns_1.startOfDay)(checkOut), 1),
    });
}
function getNightCount({ checkIn, checkOut, }) {
    return (0, date_fns_1.differenceInCalendarDays)((0, date_fns_1.startOfDay)(checkOut), (0, date_fns_1.startOfDay)(checkIn));
}
