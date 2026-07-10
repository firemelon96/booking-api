"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyGoogleToken = verifyGoogleToken;
exports.verifyAppleToken = verifyAppleToken;
exports.verifyGithubToken = verifyGithubToken;
//Google verification
const axios_1 = __importDefault(require("axios"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
async function verifyGoogleToken(idToken) {
    const res = await axios_1.default.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    //TODO: add return type chheck for email verified by provider
    return {
        email: res.data.email,
        providerAccountId: res.data.sub,
        emailVerified: res.data.email_verified,
    };
}
async function verifyAppleToken(identityToken) {
    const decoded = jsonwebtoken_1.default.decode(identityToken);
    if (!decoded?.email)
        throw new Error('Invalid Apple token');
    return {
        email: decoded.email,
        providerAccountId: decoded.sub,
        emailVerified: decoded.verified,
    };
}
async function verifyGithubToken(accessToken) {
    const res = await axios_1.default.get('https://api.github.com/user', {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });
    return {
        email: res.data.email,
        providerAccountId: res.data.id.toString(),
        emailVerified: false,
    };
}
