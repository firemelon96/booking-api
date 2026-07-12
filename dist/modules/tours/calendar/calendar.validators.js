"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calendarQuery = void 0;
const zod_1 = require("zod");
exports.calendarQuery = zod_1.z.object({
    month: zod_1.z.string().regex(/^\d{4}-\d{2}$/),
    scheduleId: zod_1.z.string().optional(),
});
