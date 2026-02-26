import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import evidenceRoutes from "./routes/evidenceRoutes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/evidence", evidenceRoutes);

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});