import { Router } from "express";
import { Evidence, SupportingDoc } from "../models/evidence.model.js";

const router = Router();

// DELETE /api/seed/clear — clears evidence + supportingdocs for reseeding
// Only available in development (NODE_ENV !== "production")
router.delete("/clear", async (_req, res) => {
  if (process.env.NODE_ENV === "production") {
    res.status(404).json({ success: false, error: "Route not found" });
    return;
  }
  try {
    await Evidence.deleteMany({});
    await SupportingDoc.deleteMany({});
    console.log("[Seed] Cleared evidence and supportingdocs collections");
    res.status(200).json({
      success: true,
      message: "Evidence and supporting docs cleared successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Clear failed",
    });
  }
});

export default router;