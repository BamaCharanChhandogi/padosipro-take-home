import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { AuthService } from "../services/auth.service";
import { OtpService } from "../services/otp.service";
import { AuthenticatedRequest } from "../middlewares";
import { prisma } from "../config";
import { AppError } from "../utils";

const requestOtpSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
  mobile: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
});

const verifyOtpSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
  code: z.string().regex(/^\d{6}$/, "Code must be 6 digits"),
});

const passwordLoginSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export class AuthController {
  static async requestOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const data = requestOtpSchema.parse(req.body);
      const result = await AuthService.requestAccessOtp(data.email, data.mobile, data.password);
      res.json({
        success: true,
        message: "Verification code sent successfully to your email.",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const data = verifyOtpSchema.parse(req.body);
      const result = await AuthService.verifyOtpAndLogin(data.email, data.code);
      res.json({
        success: true,
        message: "Email verified successfully.",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async resendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = z.object({ email: z.string().email() }).parse(req.body);
      const result = await OtpService.requestOtp(email);
      res.json({
        success: true,
        message: "A fresh verification code has been dispatched to your email.",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = passwordLoginSchema.parse(req.body);
      const result = await AuthService.loginWithPassword(data.email, data.password);
      res.json({
        success: true,
        message: "Logged in successfully.",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        include: { profile: true },
      });

      if (!user) throw new AppError("User not found.", 404);

      res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          mobile: user.mobile,
          isVerified: user.isVerified,
          hasCompletedProfile: user.hasCompletedProfile,
          profile: user.profile,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}
