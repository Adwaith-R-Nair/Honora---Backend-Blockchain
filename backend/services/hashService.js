import crypto from "crypto";

export function generateSHA256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}