import { Router } from "express";
import { handleUpload } from "../middleware/upload.middleware.js";
import {
  uploadEvidence,
  getEvidenceById,
  getEvidenceHistory,
} from "../controllers/evidence.controller.js";

const router = Router();

// POST /api/evidence/upload — upload file + register on-chain
router.post("/upload", handleUpload, uploadEvidence);

// GET /api/evidence/:id — get evidence metadata by ID
router.get("/:id", getEvidenceById);

// GET /api/evidence/:id/history — get full custody history
router.get("/:id/history", getEvidenceHistory);

export default router;