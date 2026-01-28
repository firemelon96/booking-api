"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTourSchema = exports.createTourSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.createTourSchema = zod_1.default.object({
    name: zod_1.default.string().min(2).max(120),
    slug: zod_1.default
        .string()
        .min(2)
        .max(140)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be kebab-case')
        .optional(),
});
exports.updateTourSchema = zod_1.default.object({
    name: zod_1.default.string().min(2).max(120),
    slug: zod_1.default
        .string()
        .min(2)
        .max(140)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be kebab-case')
        .optional(),
});
