"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendVerificationEmail = sendVerificationEmail;
exports.sendResetPasswordEmail = sendResetPasswordEmail;
const resend_1 = require("../../../config/resend");
async function sendVerificationEmail(email, token) {
    const url = `${process.env.APP_URL}/verify-email?token=${token}`;
    const html = `
    <h2>Verify your email</h2>
    <p>Click the link below:</p>
    <a href="${url}">${url}</a>
  `;
    await (0, resend_1.sendEmail)({
        to: email,
        subject: 'Verify your email',
        html,
    });
}
async function sendResetPasswordEmail(email, token) {
    const url = `${process.env.APP_URL}/reset-password?token=${token}`;
    //   if (process.env.NODE_ENV === 'development') {
    //     console.log('RESET LINK', url);
    //     return;
    //   }
    const html = `
    <h2>Reset your password</h2>
    <p>Click the link below to reset your password:</p>
    <a href="${url}">${url}</a>
    <p>This link expires in 30 minutes.</p>
  `;
    await (0, resend_1.sendEmail)({
        to: email,
        subject: 'Reset your password',
        html,
    });
}
