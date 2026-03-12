import express from "express";
import { ENV } from "./config/env.js";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import evidenceRoutes from "./routes/evidence.routes.js";
import custodyRoutes from "./routes/custody.routes.js";
import supportingDocRoutes from "./routes/supportingDoc.routes.js";

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
app.use("/api/auth", authRoutes);
app.use("/api/evidence", evidenceRoutes);
app.use("/api/custody", custodyRoutes);
app.use("/api/supporting-docs", supportingDocRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

// ── Connect to MongoDB then start server ──────────────────────────────────────
await connectDB();

app.listen(ENV.PORT, () => {
  console.log(`\n🚀 EMS Backend running on http://localhost:${ENV.PORT}`);
  console.log(`📋 Health check: http://localhost:${ENV.PORT}/health`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  POST http://localhost:${ENV.PORT}/api/auth/register`);
  console.log(`  POST http://localhost:${ENV.PORT}/api/auth/login`);
  console.log(`  POST http://localhost:${ENV.PORT}/api/evidence/upload        [Police]`);
  console.log(`  GET  http://localhost:${ENV.PORT}/api/evidence/:id           [All]`);
  console.log(`  GET  http://localhost:${ENV.PORT}/api/evidence/:id/history   [All]`);
  console.log(`  POST http://localhost:${ENV.PORT}/api/custody/transfer       [Police, Forensic]`);
  console.log(`  POST http://localhost:${ENV.PORT}/api/supporting-docs/upload [Forensic, Lawyer]`);
  console.log(`  GET  http://localhost:${ENV.PORT}/api/supporting-docs/:id    [All]`);
  console.log(`  POST http://localhost:${ENV.PORT}/api/supporting-docs/verify/:id [Forensic, Judge]`);
});

export default app;