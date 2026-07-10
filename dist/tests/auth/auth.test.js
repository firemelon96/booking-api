"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const test_app_1 = require("../test-app");
const prisma_1 = require("../../src/config/prisma");
const crypto_1 = require("../../src/config/crypto");
const app = (0, test_app_1.createTestApp)();
describe('Auth Flow', () => {
    const email = 'jamionestong@gmail.com';
    const password = 'password1234';
    //Register
    it('should register user and create verification token', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/auth/register')
            .send({ email, password });
        expect(res.status).toBe(200);
        const user = await prisma_1.prisma.user.findUnique({ where: { email } });
        expect(user).toBeTruthy();
        expect(user?.emailVerified).toBe(false);
        const token = await prisma_1.prisma.emailVerificationToken.findFirst();
        expect(token).toBeTruthy();
    });
    //verify email
    it('should verify email', async () => {
        const user = await prisma_1.prisma.user.create({
            data: { email, password: 'hashed', emailVerified: false },
        });
        const rawToken = 'verify-token';
        const hashed = (0, crypto_1.hashToken)(rawToken);
        await prisma_1.prisma.emailVerificationToken.create({
            data: {
                userId: user.id,
                token: hashed,
                expiresAt: new Date(Date.now() + 1000 * 60 * 60),
            },
        });
        const res = await (0, supertest_1.default)(app).get(`/auth/verify-email?token=${rawToken}`);
        expect(res.status).toBe(200);
        const updated = await prisma_1.prisma.user.findUnique({ where: { email } });
        expect(updated?.emailVerified).toBe(true);
    });
    //login block if not verified
    it('should block unverified user email', async () => {
        await prisma_1.prisma.user.create({
            data: { email, password: 'pass', emailVerified: false },
        });
        const res = await (0, supertest_1.default)(app).post('/auth/login').send({
            email,
            password,
        });
        expect(res.status).toBe(500);
    });
    //login success
    it('should login verified user and set cookies', async () => {
        await prisma_1.prisma.user.create({
            data: {
                email,
                password: await require('bcrypt').hash(password, 10),
                emailVerified: true,
            },
        });
        const res = await (0, supertest_1.default)(app)
            .post('/auth/login')
            .send({ email, password });
        expect(res.status).toBe(200);
        const cookies = res.headers['set-cookie'] || [];
        const cookieArray = Array.isArray(cookies) ? cookies : [cookies];
        expect(cookies).toBeDefined();
        const hasRefresh = cookieArray.some((c) => c.includes('refreshToken'));
        expect(hasRefresh).toBe(true);
        const session = await prisma_1.prisma.session.findMany();
        expect(session.length).toBe(1);
    });
    //refresh token
    it('should refresh token and rotate session', async () => {
        const login = await (0, supertest_1.default)(app)
            .post('/auth/oauth')
            .send({ provider: 'google', token: 'user1' });
        const cookies = login.headers['set-cookie'];
        const res = await (0, supertest_1.default)(app).post('/auth/refresh').set('Cookie', cookies);
        expect(res.status).toBe(200);
        const sessions = await prisma_1.prisma.session.findMany();
        expect(sessions.length).toBe(1);
    });
    //logout
    it('should logout and delete session', async () => {
        const login = await (0, supertest_1.default)(app)
            .post('/auth/oauth')
            .send({ provider: 'google', token: 'user2' });
        const cookies = login.headers['set-cookie'];
        const res = await (0, supertest_1.default)(app).post('/auth/logout').set('Cookie', cookies);
        expect(res.status).toBe(200);
        const session = await prisma_1.prisma.session.findMany();
        expect(session.length).toBe(0);
    });
    //forgot password
    it('should create reset token', async () => {
        const user = await prisma_1.prisma.user.create({
            data: { email, password: 'hashed', emailVerified: true },
        });
        const res = await (0, supertest_1.default)(app)
            .post('/auth/forgot-password')
            .send({ email });
        expect(res.status).toBe(200);
        const token = await prisma_1.prisma.passwordResetToken.findFirst();
        expect(token).toBeTruthy();
    });
    //reset password
    it('should reset password and delete sessions', async () => {
        const user = await prisma_1.prisma.user.create({
            data: { email, password: 'old', emailVerified: true },
        });
        const rawToken = 'reset-token';
        const hashed = (0, crypto_1.hashToken)(rawToken);
        await prisma_1.prisma.passwordResetToken.create({
            data: {
                userId: user.id,
                token: hashed,
                expiresAt: new Date(Date.now() + 1000 * 60 * 10),
            },
        });
        const res = await (0, supertest_1.default)(app)
            .post('/auth/reset-password')
            .send({ token: rawToken, newPassword: 'newPassword123' });
        expect(res.status).toBe(200);
        const sessions = await prisma_1.prisma.session.findMany();
        expect(sessions.length).toBe(0);
    });
});
