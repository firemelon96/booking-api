import { sendEmail } from '../../../config/resend';

export async function sendVerificationEmail(email: string, token: string) {
  const url = `${process.env.APP_URL}/verify-email?token=${token}`;

  const html = `
    <h2>Verify your email</h2>
    <p>Click the link below:</p>
    <a href="${url}">${url}</a>
  `;

  await sendEmail({
    to: email,
    subject: 'Verify your email',
    html,
  });
}

export async function sendResetPasswordEmail(email: string, token: string) {
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

  await sendEmail({
    to: email,
    subject: 'Reset your password',
    html,
  });
}
