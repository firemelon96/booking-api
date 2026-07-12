"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.oauthVerifier = oauthVerifier;
exports.checkVerifiedUserEmail = checkVerifiedUserEmail;
const mock_oauth_1 = require("../../config/mock-oauth");
const oauth_1 = require("../../config/oauth");
const prisma_1 = require("../../config/prisma");
async function oauthVerifier({ provider, token, }) {
    if (process.env.MOCK_OAUTH === 'true') {
        return (0, mock_oauth_1.mockVerifyOAuth)(token, provider);
    }
    if (provider === 'google')
        return (0, oauth_1.verifyGoogleToken)(token);
    if (provider === 'apple')
        return (0, oauth_1.verifyAppleToken)(token);
    if (provider === 'github')
        return (0, oauth_1.verifyGithubToken)(token);
    throw new Error('Invalid provider');
}
async function checkVerifiedUserEmail(email) {
    const user = await prisma_1.prisma.user.findUnique({ where: { email } });
    if (!user) {
        throw new Error('User not found');
    }
    if (!user.emailVerified)
        throw new Error('Please verify your email first');
    return user;
}
