"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const prisma_1 = require("./prisma");
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/auth/google/callback',
}, async (_accessToken, _refreshToken, profile, done) => {
    try {
        let user = await prisma_1.prisma.user.findUnique({
            where: { googleId: profile.id },
        });
        if (!user) {
            user = await prisma_1.prisma.user.create({
                data: {
                    googleId: profile.id,
                    email: profile.emails?.[0].value || '',
                    name: profile.displayName,
                },
            });
        }
        return done(null, {
            userId: user.id,
            email: user.email,
            role: user.role,
        });
    }
    catch (err) {
        return done(err, undefined);
    }
}));
exports.default = passport_1.default;
