"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createItinerarySchema = void 0;
const zod_1 = require("zod");
exports.createItinerarySchema = zod_1.z.object({
    title: zod_1.z.string().min(2),
    activities: zod_1.z.string().array(),
    destinations: zod_1.z.string().array(),
});
