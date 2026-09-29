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
  const statusCode = err.statusCode || 500;
  const message = err.message || "An unexpected error occurred.";
  const code = err.code || "INTERNAL_ERROR";

  if (statusCode === 500) {
    console.error("Unhandled error:", err);
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
