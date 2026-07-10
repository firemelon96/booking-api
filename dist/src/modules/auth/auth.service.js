"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.oauthLogin = oauthLogin;
exports.login = login;
exports.register = register;
exports.verifyEmail = verifyEmail;
exports.resendVerification = resendVerification;
exports.forgotPassword = forgotPassword;
exports.resetPassword = resetPassword;
const crypto_1 = __importDefault(require("crypto"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma_1 = require("../../config/prisma");
const auth_query_1 = require("./auth.query");
const token_service_1 = require("./token/token.service");
const crypto_2 = require("../../config/crypto");
const email_service_1 = require("./email/email.service");
async function oauthLogin({ email, provider, providerAccountId, emailVerified, }) {
    if (!emailVerified) {
        throw new Error('Oauth email not verified');
    }
    const existingAccount = await prisma_1.prisma.account.findUnique({
        where: {
            provider_providerAccountId: {
                provider,
                providerAccountId,
            },
        },
        include: {
            user: true,
        },
    });
    let user;
    if (existingAccount) {
        user = existingAccount.user;
    }
    else {
        user = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (!user) {
            user = await prisma_1.prisma.user.create({
                data: { email, emailVerified: true },
            });
        }
        if (user && !user.emailVerified) {
            user = await prisma_1.prisma.user.update({
                where: { email },
                data: { emailVerified: true },
            });
        }
        await prisma_1.prisma.account.upsert({
            where: {
                provider_providerAccountId: {
                    provider,
                    providerAccountId,
                },
            },
            create: {
                userId: user.id,
                provider,
                providerAccountId,
            },
            update: {},
        });
    }
    const accessToken = (0, token_service_1.signAccessToken)({
        userId: user.id,
        role: user.role,
    });
    const refreshToken = (0, crypto_2.generateRefreshToken)();
    return { user, accessToken, refreshToken };
}
async function login({ email, password }) {
    const user = await (0, auth_query_1.checkVerifiedUserEmail)(email);
    if (!user.password) {
        // const hashedPassword = await bcrypt.hash(password, 10);
        // await prisma.user.update({
        //   where: { id: user.id },
        //   data: { password: hashedPassword },
        // });
        throw new Error('Invalid credentials');
    }
    const valid = await bcrypt_1.default.compare(password, user.password);
    if (!valid) {
        throw new Error('Invalid credentials');
    }
    const accessToken = (0, token_service_1.signAccessToken)({
        userId: user.id,
        role: user.role,
    });
    const refreshToken = (0, crypto_2.generateRefreshToken)();
    return { user, accessToken, refreshToken };
}
async function register({ email, password }) {
    const hashedPassword = await bcrypt_1.default.hash(password, 10);
    const user = await prisma_1.prisma.user.create({
        data: { email, password: hashedPassword },
        select: { id: true, email: true, role: true },
    });
    const rawToken = crypto_1.default.randomBytes(32).toString('hex');
    const hashed = (0, crypto_2.hashToken)(rawToken);
    await prisma_1.prisma.emailVerificationToken.create({
        data: {
            userId: user.id,
            token: hashed,
            expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        },
    });
    await (0, email_service_1.sendVerificationEmail)(email, rawToken);
    return user;
}
async function verifyEmail({ token }) {
    const hashed = (0, crypto_2.hashToken)(token);
    const record = await prisma_1.prisma.emailVerificationToken.findUnique({
        where: { token: hashed },
    });
    if (!record || record.expiresAt < new Date()) {
        throw new Error('Invalid or expired token');
    }
    await prisma_1.prisma.user.update({
        where: {
            id: record.userId,
        },
        data: {
            emailVerified: true,
        },
    });
    await prisma_1.prisma.emailVerificationToken.delete({
        where: { id: record.id },
    });
    return true;
}
async function resendVerification({ email }) {
    const user = await prisma_1.prisma.user.findUnique({ where: { email } });
    if (!user || user.emailVerified)
        return;
    const rawToken = crypto_1.default.randomBytes(32).toString('hex');
    const hashed = (0, crypto_2.hashToken)(rawToken);
    await prisma_1.prisma.emailVerificationToken.create({
        data: {
            userId: user.id,
            token: hashed,
            expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        },
    });
    await (0, email_service_1.sendVerificationEmail)(user.email, rawToken);
}
async function forgotPassword({ email }) {
    const user = await prisma_1.prisma.user.findUnique({ where: { email } });
    if (!user)
        return;
    const rawToken = crypto_1.default.randomBytes(32).toString('hex');
    const hashedToken = (0, crypto_2.hashToken)(rawToken);
    await prisma_1.prisma.passwordResetToken.create({
        data: {
            userId: user.id,
            token: hashedToken,
            expiresAt: new Date(Date.now() + 1000 * 60 * 30),
        },
    });
    await (0, email_service_1.sendResetPasswordEmail)(user.email, rawToken);
    return rawToken;
}
async function resetPassword({ token, newPassword, }) {
    const hashedToken = (0, crypto_2.hashToken)(token);
    const resetToken = await prisma_1.prisma.passwordResetToken.findUnique({
        where: { token: hashedToken },
    });
    if (!resetToken || resetToken.expiresAt < new Date()) {
        throw new Error('Invalid or expired token');
    }
    const hashedPassword = await bcrypt_1.default.hash(newPassword, 10);
    await prisma_1.prisma.user.update({
        where: {
            id: resetToken.userId,
        },
        data: {
            password: hashedPassword,
        },
    });
    await prisma_1.prisma.session.deleteMany({
        where: {
            userId: resetToken.userId,
        },
    });
    await prisma_1.prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
    });
}
