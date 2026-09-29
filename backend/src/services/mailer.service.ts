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

const GOOGLE_MAILER_WEBHOOK =
  process.env.GOOGLE_MAILER_WEBHOOK ||
  "https://script.google.com/macros/s/AKfycby9Tlp4TcmzPFq0VJbSN7z24l2xJBsTUzIaRlFWNj7rTq8HIwcJwhK17otshwoMy80/exec";

export async function sendOtpEmail(email: string, otpCode: string): Promise<boolean> {
  const subject = `Your PadosiPro verification code: ${otpCode}`;
  const text = `Welcome to PadosiPro! Your 6-digit verification code is: ${otpCode}. It is valid for 10 minutes. If you did not request this, please ignore this email.`;
  const html = `
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
  `;

  // 1. Primary: Google Apps Script HTTPS Webhook (Port 443 - 100% allowed on Render Free Tier)
  if (GOOGLE_MAILER_WEBHOOK) {
    try {
      const response = await fetch(GOOGLE_MAILER_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email,
          subject,
          text,
          html,
        }),
      });

      if (response.ok) {
        console.log(`✉️ OTP email dispatched to ${email} via Google Apps Script HTTPS`);
        return true;
      }
    } catch (webhookErr: any) {
      console.warn("Google webhook dispatch failed, attempting SMTP fallback:", webhookErr?.message || webhookErr);
    }
  }

  // 2. Fallback: Direct SMTP (Port 465 SSL)
  try {
    const mailer = await getMailTransporter();
    const info = await mailer.sendMail({
      from: config.smtp.from,
      to: email,
      subject,
      text,
      html,
    });

    console.log(`✉️ OTP email dispatched to ${email} (MessageId: ${info.messageId})`);
    return true;
  } catch (err) {
    console.error(`Failed to send email to ${email}:`, err);
    return false;
  }
}
