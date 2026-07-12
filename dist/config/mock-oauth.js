"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockVerifyOAuth = void 0;
const mockVerifyOAuth = (token, provider) => {
    // token can be anything (or structured)
    const fakeId = token || 'mock-user-123';
    return {
        email: 'jamionestong@gmail.com',
        providerAccountId: `${provider}-${fakeId}`,
        emailVerified: true,
    };
};
exports.mockVerifyOAuth = mockVerifyOAuth;
