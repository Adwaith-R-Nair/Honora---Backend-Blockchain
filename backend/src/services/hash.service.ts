import crypto from "crypto";

/**
 * Generates a SHA-256 hash from a file buffer.
 * This hash is stored on-chain for cryptographic integrity verification.
 * @param buffer - The raw file buffer from multer
 * @returns Hex-encoded SHA-256 hash string
 */
export function generateFileHash(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}