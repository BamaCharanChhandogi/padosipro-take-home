import crypto from "crypto";
import bcrypt from "bcryptjs";

export class AppError extends Error {
  public statusCode: number;
  public code?: string;

  constructor(message: string, statusCode = 400, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Hashes a 6-digit OTP code using SHA-256 with a salt
 */
export function hashOtp(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

/**
 * Generates a random 6-digit numeric OTP string
 */
export function generateNumericOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Hashes passwords with bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Compares plain password with bcrypt hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
