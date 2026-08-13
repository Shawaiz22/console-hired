import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
});

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  await transporter.sendMail({
    from: `"console.hired()" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  });
}

export function otpEmailTemplate(code: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Code</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 24px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 32px; border: 1px solid #e4e4e7;">
    <tr>
      <td>
        <h2 style="margin-top: 0; margin-bottom: 16px; color: #18181b; font-size: 20px; font-weight: 600; text-align: center;">Verify your email address</h2>
        <p style="margin-top: 0; margin-bottom: 24px; color: #71717a; font-size: 14px; line-height: 1.5; text-align: center;">Use the 6-digit verification code below to complete your registration for <strong>console.hired()</strong>.</p>
        
        <div style="background-color: #f4f4f5; border-radius: 6px; padding: 16px; text-align: center; margin-bottom: 24px;">
          <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #18181b; display: inline-block;">${code}</span>
        </div>
        
        <p style="margin-top: 0; margin-bottom: 16px; color: #71717a; font-size: 13px; text-align: center;">This code will expire in <strong>10 minutes</strong>.</p>
        <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
        <p style="margin: 0; color: #a1a1aa; font-size: 12px; text-align: center;">If you didn't request this, you can ignore this email.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
