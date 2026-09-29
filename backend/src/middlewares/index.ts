import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config, prisma } from "../config";
import { AppError } from "../utils";
import { TokenPayload } from "../services/auth.service";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("Authentication token is missing.", 401, "UNAUTHORIZED");
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, config.jwtSecret) as TokenPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, isVerified: true },
    });

    if (!user) {
      throw new AppError("User not found or deleted.", 401, "USER_NOT_FOUND");
    }

    if (!user.isVerified) {
      throw new AppError("Email is not verified.", 403, "EMAIL_NOT_VERIFIED");
    }

    req.user = { id: user.id, email: user.email };
    next();
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      return next(new AppError("Session expired. Please log in again.", 401, "TOKEN_EXPIRED"));
    }
    if (err.name === "JsonWebTokenError") {
      return next(new AppError("Invalid session token.", 401, "INVALID_TOKEN"));
    }
    next(err);
  }
}

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  let statusCode = err.statusCode || 500;
  let message = err.message || "An unexpected error occurred.";
  let code = err.code || "INTERNAL_ERROR";

  // Gracefully handle Zod validation errors
  if (err.name === "ZodError" && err.issues?.length > 0) {
    statusCode = 400;
    code = "VALIDATION_ERROR";
    message = err.issues.map((i: any) => i.message).join(". ");
  }

  // Gracefully handle Prisma unique constraint violations (P2002)
  if (err.code === "P2002") {
    statusCode = 409;
    code = "DUPLICATE_ENTRY";
    const target = Array.isArray(err.meta?.target) ? err.meta.target.join(", ") : (err.meta?.target || "");
    if (target.includes("mobile")) {
      message = "This mobile number is already registered. Please check or log in.";
    } else if (target.includes("email")) {
      message = "An account with this email address already exists.";
    } else {
      message = "A record with these details already exists.";
    }
  }

  // Sanitize any internal database/Prisma errors from leaking to user
  if (err.name?.includes("Prisma") || message.includes("prisma.") || message.includes("invocation:")) {
    statusCode = statusCode === 500 ? 400 : statusCode;
    message = "Unable to process request with provided details. Please check your inputs.";
  }

  if (statusCode === 500) {
    console.error("Unhandled error:", err);
    message = "An unexpected server error occurred. Please try again in a moment.";
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      code,
      details: err.details || undefined,
    },
  });
}
