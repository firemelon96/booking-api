"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSession = createSession;
exports.logout = logout;
exports.logoutAllSession = logoutAllSession;
exports.refreshSession = refreshSession;
const prisma_1 = require("../../../config/prisma");
const crypto_1 = require("../../../config/crypto");
const token_service_1 = require("../token/token.service");
async function createSession({ userId, refreshToken, userAgent, ip, }) {
    const hashed = (0, crypto_1.hashToken)(refreshToken);
    return prisma_1.prisma.session.create({
        data: {
            userId,
            refreshToken: hashed,
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
            ip,
            userAgent,
        },
    });
}
async function logout(refreshToken) {
    const hashed = (0, crypto_1.hashToken)(refreshToken);
    return prisma_1.prisma.session.deleteMany({
        where: { refreshToken: hashed },
    });
}
async function logoutAllSession(userId) {
    return prisma_1.prisma.session.deleteMany({
        where: { userId },
    });
}
async function refreshSession(oldRefreshToken) {
    const hashed = (0, crypto_1.hashToken)(oldRefreshToken);
    const session = await prisma_1.prisma.session.findUnique({
        where: { refreshToken: hashed },
        include: { user: true },
    });
    if (!session) {
        throw new Error('Invalid session');
    }
    if (session.expiresAt < new Date()) {
        throw new Error('Session expired');
    }
    await prisma_1.prisma.session.delete({ where: { id: session.id } });
    const newAccessToken = (0, token_service_1.signAccessToken)({
        userId: session.user.id,
        role: session.user.role,
    });
    const newRefreshToken = (0, crypto_1.generateRefreshToken)();
    return {
        session,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
    };
}
