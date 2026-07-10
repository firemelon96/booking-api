"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unitQuerySchema = exports.createUnitSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.createUnitSchema = zod_1.default.object({
    accommodationId: zod_1.default.uuid(),
    name: zod_1.default.string().min(2),
    description: zod_1.default.string().optional(),
    maxAdult: zod_1.default.number().int(),
    maxChildren: zod_1.default.number().int().optional(),
    bedrooms: zod_1.default.number().int().optional(),
    bathrooms: zod_1.default.number().int().optional(),
    quantity: zod_1.default.number().int().min(1),
    basePrice: zod_1.default.number().positive(),
    amenityIds: zod_1.default.string().array().optional(),
});
exports.unitQuerySchema = zod_1.default.object({
    page: zod_1.default.number().optional(),
    limit: zod_1.default.number().optional(),
    sort: zod_1.default.string().optional(),
    search: zod_1.default.string().optional(),
    accommodationId: zod_1.default.string(),
});
