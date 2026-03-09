import express from "express";
import { ENV } from "./config/env.js";
import evidenceRoutes from "./routes/evidence.routes.js";
import custodyRoutes from "./routes/custody.routes.js";

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    message: "EMS Backend is running",
    timestamp: new Date().toISOString(),
  });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/evidence", evidenceRoutes);
app.use("/api/custody", custodyRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

// ── Start server ──────────────────────────────────────────────────────────────
app.listen(ENV.PORT, () => {
  console.log(`\n🚀 EMS Backend running on http://localhost:${ENV.PORT}`);
  console.log(`📋 Health check: http://localhost:${ENV.PORT}/health`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  POST http://localhost:${ENV.PORT}/api/evidence/upload`);
  console.log(`  GET  http://localhost:${ENV.PORT}/api/evidence/:id`);
  console.log(`  GET  http://localhost:${ENV.PORT}/api/evidence/:id/history`);
  console.log(`  POST http://localhost:${ENV.PORT}/api/custody/transfer`);
});

export default app;