import { Router } from "express";
import { authenticateJWT } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { transferEvidenceCustody } from "../controllers/custody.controller.js";

const router = Router();

// POST /api/custody/transfer — Police or Forensic only
router.post(
  "/transfer",
  authenticateJWT,
  requireRole("Police", "Forensic"),
  transferEvidenceCustody
);

export default router;