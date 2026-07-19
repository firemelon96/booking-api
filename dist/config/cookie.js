"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshCookieOptions = exports.accessCookieOptions = void 0;
const env_1 = require("./env");
exports.accessCookieOptions = {
    httpOnly: true,
    secure: env_1.env.NODE_ENV === 'production', //dev only
    sameSite: env_1.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
    maxAge: 15 * 60 * 1000,
};
exports.refreshCookieOptions = {
    httpOnly: true,
    secure: env_1.env.NODE_ENV === 'production', //dev only
    sameSite: env_1.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60 * 1000,
};
