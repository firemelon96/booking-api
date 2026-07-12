"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.daysSchema = void 0;
const zod_1 = require("zod");
const items = zod_1.z.object({
    time: zod_1.z.string().min(1),
    title: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    order: zod_1.z.number().int().min(0),
});
exports.daysSchema = zod_1.z
    .object({
    dayNumber: zod_1.z.number().int().min(1),
    title: zod_1.z.string().optional(),
    items: items.array(),
})
    .array();
