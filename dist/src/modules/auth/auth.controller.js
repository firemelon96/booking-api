"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.oauth = oauth;
exports.login = login;
exports.register = register;
exports.verifyEmail = verifyEmail;
exports.resendVerification = resendVerification;
exports.logout = logout;
exports.logoutAllSession = logoutAllSession;
exports.refreshSession = refreshSession;
exports.forgotPassword = forgotPassword;
exports.resetPassword = resetPassword;
const auth_query_1 = require("./auth.query");
const AuthService = __importStar(require("./auth.service"));
const cookie_1 = require("../../config/cookie");
const auth_validator_1 = require("./auth.validator");
const SessionService = __importStar(require("../auth/session/session.service"));
async function oauth(req, res, next) {
    const { provider, token } = req.body;
    const profile = await (0, auth_query_1.oauthVerifier)({ provider, token });
    try {
        const { user, accessToken, refreshToken } = await AuthService.oauthLogin({
            email: profile?.email,
            provider,
            providerAccountId: profile?.providerAccountId,
            emailVerified: profile.emailVerified,
        });
        await SessionService.createSession({
            userId: user.id,
            refreshToken,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
        });
        res.cookie('accessToken', accessToken, cookie_1.accessCookieOptions);
        res.cookie('refreshToken', refreshToken, cookie_1.refreshCookieOptions);
        return res.json({ user });
    }
    catch (error) {
        next(error);
    }
}
async function login(req, res, next) {
    const payload = auth_validator_1.loginSchema.safeParse(req.body);
    if (!payload.success) {
        throw new Error('Invalid fields');
    }
    try {
        const { user, accessToken, refreshToken } = await AuthService.login(payload.data);
        await SessionService.createSession({
            userId: user.id,
            refreshToken,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
        });
        res.cookie('accessToken', accessToken, cookie_1.accessCookieOptions);
        res.cookie('refreshToken', refreshToken, cookie_1.refreshCookieOptions);
        return res.json({ user });
    }
    catch (error) {
        next(error);
    }
}
async function register(req, res, next) {
    const payload = auth_validator_1.registerSchema.safeParse(req.body);
    if (!payload.success) {
        throw new Error('Invalid fields');
    }
    try {
        const user = await AuthService.register(payload.data);
        res.json({ user });
    }
    catch (error) {
        next(error);
    }
}
async function verifyEmail(req, res, next) {
    const payload = auth_validator_1.verifyEmailSchema.safeParse(req.query);
    if (!payload.success) {
        throw new Error('Invalid fields');
    }
    try {
        await AuthService.verifyEmail(payload.data);
        return res.json({ success: true, message: 'Email verified, Please login' });
    }
    catch (error) {
        next(error);
    }
}
async function resendVerification(req, res, next) {
    const payload = auth_validator_1.sendEmailSchema.safeParse(req.body);
    if (!payload.success) {
        throw new Error('Invalid fields');
    }
    try {
        await AuthService.resendVerification(payload.data);
        return res.json({
            success: true,
            message: 'Email sent.',
        });
    }
    catch (error) {
        next(error);
    }
}
async function logout(req, res, next) {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
        throw new Error('Unauthorized');
    }
    try {
        await SessionService.logout(refreshToken);
        res.clearCookie('accessToken', cookie_1.accessCookieOptions);
        res.clearCookie('refreshToken', cookie_1.refreshCookieOptions);
        return res.json({ success: true });
    }
    catch (error) {
        next(error);
    }
}
async function logoutAllSession(req, res, next) {
    const { userId } = req.body;
    try {
        await SessionService.logoutAllSession(userId);
        res.clearCookie('accessToken', cookie_1.accessCookieOptions);
        res.clearCookie('refreshToken', cookie_1.refreshCookieOptions);
        return res.json({ success: true });
    }
    catch (error) {
        next(error);
    }
}
async function refreshSession(req, res, next) {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        const { session, accessToken, refreshToken: newRefreshToken, } = await SessionService.refreshSession(refreshToken);
        await SessionService.createSession({
            userId: session.user.id,
            refreshToken: newRefreshToken,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
        });
        res.cookie('accessToken', accessToken, cookie_1.accessCookieOptions);
        res.cookie('refreshToken', newRefreshToken, cookie_1.refreshCookieOptions);
        return res.json({ success: true, session });
    }
    catch (error) {
        next(error);
    }
}
async function forgotPassword(req, res, next) {
    const payload = auth_validator_1.sendEmailSchema.safeParse(req.body);
    if (!payload.success) {
        throw new Error('Invalid fields');
    }
    try {
        const token = await AuthService.forgotPassword(payload.data);
        return res.json({ success: true, message: token });
    }
    catch (error) {
        next(error);
    }
}
async function resetPassword(req, res, next) {
    const payload = auth_validator_1.resetPasswordSchema.safeParse(req.body);
    if (!payload.success) {
        throw new Error('Invalid fields');
    }
    try {
        await AuthService.resetPassword(payload.data);
        res.json({ success: true });
    }
    catch (error) {
        next(error);
    }
}
