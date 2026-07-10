"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userIdSchema = exports.userQuerySchema = void 0;
const zod_1 = __importDefault(require("zod"));
const enums_1 = require("../../generated/prisma/enums");
exports.userQuerySchema = zod_1.default.object({
    page: zod_1.default.number().optional(),
    limit: zod_1.default.number().optional(),
    sort: zod_1.default.string().optional(),
    search: zod_1.default.string().optional(),
    role: zod_1.default.enum(enums_1.Role).optional(),
});
exports.userIdSchema = zod_1.default.object({
    userId: zod_1.default.uuid(),
});
