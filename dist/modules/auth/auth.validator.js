"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordSchema = exports.sendEmailSchema = exports.verifyEmailSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.email(),
    password: zod_1.z.string().min(6),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.email(),
    password: zod_1.z.string().min(6),
});
exports.verifyEmailSchema = zod_1.z.object({
    token: zod_1.z.string(),
});
exports.sendEmailSchema = zod_1.z.object({
    email: zod_1.z.email(),
});
exports.resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string(),
    newPassword: zod_1.z.string().min(1),
});
