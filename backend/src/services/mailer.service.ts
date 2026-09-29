import nodemailer from "nodemailer";
import { config } from "../config";

let transporter: nodemailer.Transporter | null = null;

export async function getMailTransporter(): Promise<nodemailer.Transporter> {
  if (transporter) return transporter;

  if (config.smtp.user && config.smtp.pass) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    });
  } else {
    // Fallback to test account (Ethereal) if no credentials provided
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log("Using Ethereal Mailer for test delivery");
  }

  return transporter;
}

export async function sendOtpEmail(email: string, otpCode: string): Promise<boolean> {
  try {
    const mailer = await getMailTransporter();
    const info = await mailer.sendMail({
      from: config.smtp.from,
      to: email,
      subject: `Your PadosiPro verification code: ${otpCode}`,
      text: `Welcome to PadosiPro! Your 6-digit verification code is: ${otpCode}. It is valid for 10 minutes. If you did not request this, please ignore this email.`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 28px; background: #FAFAF8; border-radius: 16px; border: 1px solid #E2E8F0;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; width: 48px; height: 48px; background-color: #175440; border-radius: 12px; line-height: 48px; color: #FFF; font-size: 24px; font-weight: bold;">P</div>
            <h2 style="color: #0F172A; margin: 12px 0 4px 0; font-size: 22px;">Verification Code</h2>
            <p style="color: #64748B; font-size: 14px; margin: 0;">Enter this code to verify your account</p>
          </div>

          <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 24px; text-align: center; margin: 20px 0;">
            <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #175440; font-family: monospace;">${otpCode}</span>
          </div>

          <p style="color: #64748B; font-size: 13px; line-height: 1.5; text-align: center;">
            This code expires in <strong>10 minutes</strong>. For security, never share this code with anyone.
          </p>

          <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0;" />
          <p style="color: #94A3B8; font-size: 11px; text-align: center; margin: 0;">
            PadosiPro — Your Dedicated Lifestyle Manager
          </p>
        </div>
      `,
    });

    console.log(`✉️ OTP email dispatched to ${email} (MessageId: ${info.messageId})`);
    return true;
  } catch (err) {
    console.error(`Failed to send email to ${email}:`, err);
    // Don't crash server if SMTP has issue; in development/review mode return true
    return false;
  }
}
