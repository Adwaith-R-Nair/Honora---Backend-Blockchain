import type { Request, Response, NextFunction } from "express";
import type { UserRole } from "../models/user.model.js";

/**
 * Role Authorization Middleware
 *
 * Used after authenticateJWT to restrict endpoints by role.
 * Accepts one or more roles — user must have at least one of them.
 *
 * Usage:
 *   router.post("/upload", authenticateJWT, requireRole("Police"), uploadEvidence);
 *   router.post("/transfer", authenticateJWT, requireRole("Police", "Forensic"), transferCustody);
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // authenticateJWT must run first — req.user must exist
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: "Access denied. Not authenticated.",
      });
      return;
    }

    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({
        success: false,
        error: `Access denied. Required role: ${allowedRoles.join(" or ")}. Your role: ${userRole}`,
      });
      return;
    }

    next();
  };
}