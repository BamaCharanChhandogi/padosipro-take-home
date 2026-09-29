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
    port: parseInt(process.env.SMTP_PORT || "465", 10),
    secure: process.env.SMTP_SECURE === "true" || !process.env.SMTP_PORT || process.env.SMTP_PORT === "465",
    user: process.env.SMTP_USER || "b.c.chhandogi@gmail.com",
    pass: process.env.SMTP_PASS || "dbubbzjsbqohxtyg",
    from: process.env.EMAIL_FROM || "PadosiPro <b.c.chhandogi@gmail.com>",
  },
  otp: {
    expiryMinutes: 10,
    maxAttempts: 5,
    resendCooldownSeconds: 30,
  },
};
