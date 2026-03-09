import multer from "multer";
import type { Request, Response, NextFunction } from "express";

// Store file in memory as a Buffer — never written to disk
// The buffer is passed directly to the hash function and Pinata upload
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB max per file
  },
});

// Single file upload under the field name "file"
export const uploadSingle = upload.single("file");

// Wraps multer in a promise so controllers can use async/await cleanly
export function handleUpload(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  uploadSingle(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      res.status(400).json({
        success: false,
        error: `File upload error: ${err.message}`,
      });
      return;
    }

    if (err) {
      res.status(500).json({
        success: false,
        error: "Unexpected error during file upload",
      });
      return;
    }

    next();
  });
}