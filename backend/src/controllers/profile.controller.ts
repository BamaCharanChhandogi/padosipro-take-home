import { Response, NextFunction } from "express";
import { z } from "zod";
import { AuthenticatedRequest } from "../middlewares";
import { prisma } from "../config";
import { AppError } from "../utils";

// Validates Indian phone number: optional +91, followed by 10 digits starting with 6-9
const indianPhoneRegex = /^(?:\+91)?[6-9]\d{9}$/;

const profileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
  phone: z
    .string()
    .refine((val) => !val || val.trim().length === 0 || indianPhoneRegex.test(val.replace(/[\s-]/g, "")), {
      message: "Please enter a valid 10-digit Indian phone number (+91 optional)",
    })
    .optional()
    .or(z.literal(""))
    .nullable(),
  addressArea: z.string().min(1, "Please provide your road, area or landmark"),
  society: z.string().optional(),
  flatUnit: z.string().optional(),
  entryNotes: z.string().optional(),
  businessName: z.string().optional(),
  city: z.string().optional().default("Mumbai"),
});

export class ProfileController {
  static async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const profile = await prisma.profile.findUnique({
        where: { userId: req.user!.id },
      });

      res.json({
        success: true,
        data: profile,
      });
    } catch (err) {
      next(err);
    }
  }

  static async saveProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = profileSchema.parse(req.body);
      const userId = req.user!.id;

      // Standardize phone format to +91XXXXXXXXXX if provided
      let formattedPhone = "";
      if (data.phone && data.phone.trim().length > 0) {
        let clean = data.phone.replace(/[\s-]/g, "");
        if (!clean.startsWith("+91")) {
          clean = `+91${clean.replace(/^0/, "")}`;
        }
        formattedPhone = clean;
      } else {
        const userRec = await prisma.user.findUnique({
          where: { id: userId },
          select: { mobile: true },
        });
        if (userRec?.mobile) {
          formattedPhone = userRec.mobile;
        }
      }

      const profile = await prisma.profile.upsert({
        where: { userId },
        update: {
          fullName: data.fullName,
          phone: formattedPhone,
          addressArea: data.addressArea,
          society: data.society || null,
          flatUnit: data.flatUnit || null,
          entryNotes: data.entryNotes || null,
          businessName: data.businessName || null,
          city: data.city || "Mumbai",
        },
        create: {
          userId,
          fullName: data.fullName,
          phone: formattedPhone,
          addressArea: data.addressArea,
          society: data.society || null,
          flatUnit: data.flatUnit || null,
          entryNotes: data.entryNotes || null,
          businessName: data.businessName || null,
          city: data.city || "Mumbai",
        },
      });

      // Update User record hasCompletedProfile flag
      try {
        await prisma.user.update({
          where: { id: userId },
          data: {
            hasCompletedProfile: true,
            mobile: formattedPhone,
          },
        });
      } catch {
        await prisma.user.update({
          where: { id: userId },
          data: {
            hasCompletedProfile: true,
          },
        });
      }

      res.json({
        success: true,
        message: "Profile saved successfully.",
        data: profile,
      });
    } catch (err) {
      next(err);
    }
  }
}
