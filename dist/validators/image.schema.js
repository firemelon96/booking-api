"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.imageSchema = void 0;
const zod_1 = require("zod");
exports.imageSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    tourId: zod_1.z.string().optional(),
    url: zod_1.z.string(),
    public_Id: zod_1.z.string(),
});
//optional
