"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
const resend_1 = require("resend");
const resend = new resend_1.Resend(process.env.RESEND_API_KEY);
async function sendEmail({ to, subject, html, }) {
    return resend.emails.send({
        from: 'onboarding@resend.dev',
        to,
        subject,
        html,
    });
}
