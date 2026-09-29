import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

export const config = {
  port: parseInt(process.env.PORT || "5000", 10),
  jwtSecret: process.env.JWT_SECRET || "padosipro_super_secret_jwt_key_2026_exclusive",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  smtp: {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.EMAIL_FROM || "PadosiPro <noreply@padosipro.com>",
  },
  otp: {
    expiryMinutes: 10,
    maxAttempts: 5,
    resendCooldownSeconds: 30,
  },
};
