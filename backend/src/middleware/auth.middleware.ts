import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ENV } from "../config/env.js";
import type { JWTPayload } from "../services/auth.service.js";

// ── Extend Express Request to carry decoded JWT payload ───────────────────────
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * JWT Authentication Middleware
 *
 * Verifies the Bearer token in the Authorization header.
 * Attaches decoded payload to req.user for downstream use.
 *
 * Usage: add `authenticateJWT` before any protected route handler.
 */
export function authenticateJWT(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      error: "Access denied. No token provided.",
    });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as JWTPayload;
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: "Token expired. Please log in again.",
      });
      return;
    }

    res.status(401).json({
      success: false,
      error: "Invalid token.",
    });
  }
}