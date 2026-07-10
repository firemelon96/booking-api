"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.locationQuerySchema = exports.updateLocationSchema = exports.locationIdParams = exports.addLocationSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const enums_1 = require("../../generated/prisma/enums");
exports.addLocationSchema = zod_1.default.object({
    name: zod_1.default.string(),
    type: zod_1.default.enum(enums_1.TransferLocationType),
    address: zod_1.default.string().optional(),
    latitude: zod_1.default.number().optional(),
    longitude: zod_1.default.number().optional(),
});
exports.locationIdParams = zod_1.default.object({
    locationId: zod_1.default.uuid(),
});
exports.updateLocationSchema = exports.addLocationSchema.optional();
exports.locationQuerySchema = zod_1.default.object({
    page: zod_1.default.number().optional(),
    limit: zod_1.default.number().optional(),
    sort: zod_1.default.string().optional(),
    search: zod_1.default.string().optional(),
    type: zod_1.default.enum(['AIRPORT', 'PORT', 'TERMINAL', 'HOTEL', 'CUSTOM']).optional(),
});
