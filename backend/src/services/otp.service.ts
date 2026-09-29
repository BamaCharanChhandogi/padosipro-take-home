import { prisma, config } from "../config";
import { generateNumericOtp, hashOtp, AppError } from "../utils";
import { sendOtpEmail } from "./mailer.service";

export class OtpService {
  /**
   * Request or create an OTP for a user/email.
   * Enforces 30s resend cooldown.
   * Stores ONLY the SHA-256 hash in database.
   */
  static async requestOtp(email: string, userId?: string) {
    const cleanEmail = email.toLowerCase().trim();
    const now = new Date();

    // Check existing active OTP for cooldown
    const existingOtp = await prisma.otp.findFirst({
      where: {
        email: cleanEmail,
        isUsed: false,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: "desc" },
    });

    if (existingOtp && existingOtp.resendCooldownUntil > now) {
      const waitSeconds = Math.ceil((existingOtp.resendCooldownUntil.getTime() - now.getTime()) / 1000);
      throw new AppError(
        `Please wait ${waitSeconds} seconds before requesting a new code.`,
        429,
        "COOLDOWN_ACTIVE"
      );
    }

    // Invalidate any previous unused OTPs for this email
    await prisma.otp.updateMany({
      where: { email: cleanEmail, isUsed: false },
      data: { isUsed: true },
    });

    // Generate new 6-digit numeric code
    const rawOtp = generateNumericOtp();
    const hashedCode = hashOtp(rawOtp);

    const expiresAt = new Date(now.getTime() + config.otp.expiryMinutes * 60 * 1000);
    const resendCooldownUntil = new Date(now.getTime() + config.otp.resendCooldownSeconds * 1000);

    const newOtpRecord = await prisma.otp.create({
      data: {
        email: cleanEmail,
        userId: userId || null,
        codeHash: hashedCode,
        attempts: 0,
        expiresAt,
        resendCooldownUntil,
        isUsed: false,
      },
    });

    // Dispatch email
    await sendOtpEmail(cleanEmail, rawOtp);

    return {
      otpId: newOtpRecord.id,
      expiresAt,
      cooldownSeconds: config.otp.resendCooldownSeconds,
      // For local testing convenience in automated environments if headers present
      ...(process.env.NODE_ENV === "test" ? { debugOtp: rawOtp } : {}),
    };
  }

  /**
   * Verify provided OTP code against stored hash.
   * Enforces 10-minute expiry, max 5 attempts, and single-use.
   */
  static async verifyOtp(email: string, inputCode: string) {
    const cleanEmail = email.toLowerCase().trim();
    const now = new Date();

    if (!/^\d{6}$/.test(inputCode)) {
      throw new AppError("Invalid code format. Please enter a 6-digit code.", 400, "INVALID_FORMAT");
    }

    const latestOtp = await prisma.otp.findFirst({
      where: { email: cleanEmail, isUsed: false },
      orderBy: { createdAt: "desc" },
    });

    if (!latestOtp) {
      throw new AppError("No active verification code found. Please request a new code.", 400, "NO_ACTIVE_OTP");
    }

    // Check expiry
    if (latestOtp.expiresAt < now) {
      await prisma.otp.update({
        where: { id: latestOtp.id },
        data: { isUsed: true },
      });
      throw new AppError("Verification code has expired. Please request a new one.", 400, "OTP_EXPIRED");
    }

    // Check max attempts
    if (latestOtp.attempts >= config.otp.maxAttempts) {
      await prisma.otp.update({
        where: { id: latestOtp.id },
        data: { isUsed: true },
      });
      throw new AppError("Too many incorrect attempts. This code is now invalid. Please request a new code.", 429, "MAX_ATTEMPTS_EXCEEDED");
    }

    // Compare hash
    const inputHash = hashOtp(inputCode);
    if (inputHash !== latestOtp.codeHash) {
      const updatedOtp = await prisma.otp.update({
        where: { id: latestOtp.id },
        data: { attempts: { increment: 1 } },
      });

      const remainingAttempts = config.otp.maxAttempts - updatedOtp.attempts;
      if (remainingAttempts <= 0) {
        await prisma.otp.update({
          where: { id: latestOtp.id },
          data: { isUsed: true },
        });
        throw new AppError("Too many incorrect attempts. This code is now invalid. Please request a new code.", 429, "MAX_ATTEMPTS_EXCEEDED");
      }

      throw new AppError(
        `Incorrect verification code. ${remainingAttempts} attempt${remainingAttempts === 1 ? "" : "s"} remaining.`,
        400,
        "INVALID_CODE"
      );
    }

    // Successful match: mark OTP as used
    await prisma.otp.update({
      where: { id: latestOtp.id },
      data: { isUsed: true },
    });

    return true;
  }
}
