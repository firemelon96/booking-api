import { sendEmail } from './mailer.service';

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
