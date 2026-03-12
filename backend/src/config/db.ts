import mongoose from "mongoose";
import { ENV } from "./env.js";

/**
 * Connects to MongoDB Atlas.
 * Called once at server startup in app.ts.
 */
export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(ENV.MONGODB_URI);
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
}