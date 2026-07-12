"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshCookieOptions = exports.accessCookieOptions = void 0;
exports.accessCookieOptions = {
    httpOnly: true,
    secure: false, //dev only
    sameSite: 'lax',
    path: '/',
    maxAge: 15 * 60 * 1000,
};
exports.refreshCookieOptions = {
    httpOnly: true,
    secure: false, //dev only
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60 * 1000,
};
