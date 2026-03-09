import type { Request, Response } from "express";
import { generateFileHash } from "../services/hash.service.js";
import { uploadToIPFS } from "../services/pinata.service.js";
import {
  addEvidence,
  getEvidence,
  getCustodyHistory,
  isFileHashRegistered,
} from "../services/contract.service.js";

/**
 * POST /api/evidence/upload
 *
 * Full upload flow:
 * 1. Receive file via multipart/form-data
 * 2. Generate SHA-256 hash
 * 3. Check for duplicate hash on-chain
 * 4. Upload file to IPFS via Pinata
 * 5. Register evidence on-chain (caseId + CID + hash)
 * 6. Return evidence record to caller
 */
export async function uploadEvidence(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // ── Validate file ───────────────────────────────────────────────────────────
    if (!req.file) {
      res.status(400).json({ success: false, error: "No file uploaded" });
      return;
    }

    // ── Validate caseId ─────────────────────────────────────────────────────────
    const caseId = parseInt(req.body.caseId, 10);
    if (isNaN(caseId) || caseId <= 0) {
      res.status(400).json({
        success: false,
        error: "caseId must be a positive integer",
      });
      return;
    }

    const { buffer, originalname } = req.file;

    // ── Step 1: Generate SHA-256 hash ───────────────────────────────────────────
    const fileHash = generateFileHash(buffer);
    console.log(`[Evidence] SHA-256 hash generated: ${fileHash}`);

    // ── Step 2: Duplicate check ─────────────────────────────────────────────────
    const isDuplicate = await isFileHashRegistered(fileHash);
    if (isDuplicate) {
      res.status(409).json({
        success: false,
        error: "This file has already been registered on-chain",
        fileHash,
      });
      return;
    }

    // ── Step 3: Upload to IPFS via Pinata ───────────────────────────────────────
    console.log(`[Evidence] Uploading to IPFS: ${originalname}`);
    const ipfsCID = await uploadToIPFS(buffer, originalname);
    console.log(`[Evidence] IPFS CID: ${ipfsCID}`);

    // ── Step 4: Register on-chain ───────────────────────────────────────────────
    console.log(`[Evidence] Registering on-chain for caseId: ${caseId}`);
    const txHash = await addEvidence(caseId, ipfsCID, fileHash);
    console.log(`[Evidence] Transaction hash: ${txHash}`);

    // ── Step 5: Return response ─────────────────────────────────────────────────
    res.status(201).json({
      success: true,
      message: "Evidence uploaded and registered on-chain",
      data: {
        caseId,
        ipfsCID,
        fileHash,
        txHash,
        filename: originalname,
        ipfsUrl: `https://gateway.pinata.cloud/ipfs/${ipfsCID}`,
      },
    });
  } catch (error) {
    console.error("[Evidence] Upload failed:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
}

/**
 * GET /api/evidence/:id
 *
 * Returns full evidence metadata for a given on-chain evidence ID.
 */
export async function getEvidenceById(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const evidenceId = parseInt(req.params.id, 10);
    if (isNaN(evidenceId) || evidenceId <= 0) {
      res.status(400).json({
        success: false,
        error: "evidenceId must be a positive integer",
      });
      return;
    }

    const evidence = await getEvidence(evidenceId);

    res.status(200).json({
      success: true,
      data: {
        evidenceId: evidence.evidenceId.toString(),
        caseId: evidence.caseId.toString(),
        ipfsCID: evidence.ipfsCID,
        fileHash: evidence.fileHash,
        uploadedBy: evidence.uploadedBy,
        timestamp: evidence.timestamp.toString(),
        currentHolder: evidence.currentHolder,
        ipfsUrl: `https://gateway.pinata.cloud/ipfs/${evidence.ipfsCID}`,
      },
    });
  } catch (error) {
    console.error("[Evidence] Fetch failed:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
}

/**
 * GET /api/evidence/:id/history
 *
 * Returns the full on-chain custody history for a given evidence ID.
 */
export async function getEvidenceHistory(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const evidenceId = parseInt(req.params.id, 10);
    if (isNaN(evidenceId) || evidenceId <= 0) {
      res.status(400).json({
        success: false,
        error: "evidenceId must be a positive integer",
      });
      return;
    }

    const history = await getCustodyHistory(evidenceId);

    res.status(200).json({
      success: true,
      data: history.map((record) => ({
        from: record.from,
        to: record.to,
        timestamp: record.timestamp.toString(),
      })),
    });
  } catch (error) {
    console.error("[Evidence] History fetch failed:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
}