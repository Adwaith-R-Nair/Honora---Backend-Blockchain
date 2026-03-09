import { Router } from "express";
import { transferEvidenceCustody } from "../controllers/custody.controller.js";

const router = Router();

// POST /api/custody/transfer — transfer custody to a new holder
router.post("/transfer", transferEvidenceCustody);

export default router;