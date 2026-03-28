import { Router } from "express";
import { handleUpload } from "../middleware/upload.middleware.js";
import { authenticateJWT } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import {
  uploadEvidence,
  getEvidenceById,
  getEvidenceHistory,
  getAllEvidence,
  updateEvidenceStatus,
} from "../controllers/evidence.controller.js";

const router = Router();

// POST /api/evidence/upload — Police only
router.post(
  "/upload",
  authenticateJWT,
  requireRole("Police"),
  handleUpload,
  uploadEvidence
);

// GET /api/evidence — all authenticated users (must be BEFORE /:id)
router.get("/", authenticateJWT, getAllEvidence);

// GET /api/evidence/:id — all authenticated users
router.get("/:id", authenticateJWT, getEvidenceById);

// GET /api/evidence/:id/history — all authenticated users
router.get("/:id/history", authenticateJWT, getEvidenceHistory);

// PATCH /api/evidence/:id/status — Police only
router.patch("/:id/status", authenticateJWT, requireRole("Police"), updateEvidenceStatus);

export default router;