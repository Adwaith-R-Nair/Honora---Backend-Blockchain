import { Router } from "express";
import { handleUpload } from "../middleware/upload.middleware.js";
import { authenticateJWT } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import {
  uploadSupportingDoc,
  getSupportingDocsByEvidence,
  verifyEvidenceIntegrity,
  verifySupportingDocIntegrity,
} from "../controllers/supportingDoc.controller.js";

const router = Router();

// POST /api/supporting-docs/upload — Forensic or Lawyer only
router.post(
  "/upload",
  authenticateJWT,
  requireRole("Forensic", "Lawyer"),
  handleUpload,
  uploadSupportingDoc
);

// GET /api/supporting-docs/:evidenceId — all authenticated users
router.get(
  "/:evidenceId",
  authenticateJWT,
  getSupportingDocsByEvidence
);

// POST /api/supporting-docs/verify/:evidenceId — Forensic or Judge only
router.post(
  "/verify/:evidenceId",
  authenticateJWT,
  requireRole("Forensic", "Judge"),
  handleUpload,
  verifyEvidenceIntegrity
);

// POST /api/supporting-docs/verify-doc/:docId — Forensic or Judge only
router.post(
  "/verify-doc/:docId",
  authenticateJWT,
  requireRole("Forensic", "Judge"),
  handleUpload,
  verifySupportingDocIntegrity
);

export default router;