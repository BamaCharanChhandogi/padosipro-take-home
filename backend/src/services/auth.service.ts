import jwt from "jsonwebtoken";
import { prisma, config } from "../config";
import { AppError, hashPassword, comparePassword } from "../utils";
import { OtpService } from "./otp.service";

export interface TokenPayload {
  userId: string;
  email: string;
}

export class AuthService {
  /**
   * Generates JWT token for verified user
   */
  static generateToken(payload: TokenPayload): string {
    return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn as any });
  }

  /**
   * Entry flow matching PadosiPro mobile screenshots:
   * User supplies email & mobile. Creates or finds user, generates & sends OTP.
   */
  static async requestAccessOtp(email: string, mobile?: string, password?: string) {
    const cleanEmail = email.toLowerCase().trim();
    const cleanMobile = mobile ? mobile.replace(/\s+/g, "") : null;

    let user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      const passwordHash = password ? await hashPassword(password) : null;
      user = await prisma.user.create({
        data: {
          email: cleanEmail,
          mobile: cleanMobile,
          passwordHash,
          isVerified: false,
        },
      });
    } else if (cleanMobile && !user.mobile) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { mobile: cleanMobile },
      });
    }

    const otpResult = await OtpService.requestOtp(cleanEmail, user.id);
    return {
      userId: user.id,
      email: user.email,
      mobile: user.mobile,
      isVerified: user.isVerified,
      hasCompletedProfile: user.hasCompletedProfile,
      ...otpResult,
    };
  }

  /**
   * Verifies OTP and logs user in
   */
  static async verifyOtpAndLogin(email: string, code: string) {
    const cleanEmail = email.toLowerCase().trim();

    await OtpService.verifyOtp(cleanEmail, code);

    const user = await prisma.user.update({
      where: { email: cleanEmail },
      data: { isVerified: true },
      include: { profile: true },
    });

    const token = this.generateToken({ userId: user.id, email: user.email });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        mobile: user.mobile,
        isVerified: user.isVerified,
        hasCompletedProfile: user.hasCompletedProfile,
        profile: user.profile,
      },
    };
  }

  /**
   * Standard password login (strictly checks verification requirement from brief)
   */
  static async loginWithPassword(email: string, password: string) {
    const cleanEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { profile: true },
    });

    if (!user || !user.passwordHash) {
      throw new AppError("Invalid email or password.", 401, "INVALID_CREDENTIALS");
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      throw new AppError("Invalid email or password.", 401, "INVALID_CREDENTIALS");
    }

    // MANDATORY REQUIREMENT: Unverified users are rejected and sent to verification
    if (!user.isVerified) {
      // Trigger new OTP for user convenience (ignore cooldown exception if already dispatched)
      try {
        await OtpService.requestOtp(user.email, user.id);
      } catch (err: any) {
        if (err?.code !== "COOLDOWN_ACTIVE") throw err;
      }
      throw new AppError(
        "Your email is not verified yet. We have sent a verification code to your email.",
        403,
        "EMAIL_NOT_VERIFIED"
      );
    }

    const token = this.generateToken({ userId: user.id, email: user.email });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        mobile: user.mobile,
        isVerified: user.isVerified,
        hasCompletedProfile: user.hasCompletedProfile,
        profile: user.profile,
      },
    };
  }
}
