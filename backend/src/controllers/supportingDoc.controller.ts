import type { Request, Response } from "express";
import { generateFileHash } from "../services/hash.service.js";
import { uploadToIPFS } from "../services/pinata.service.js";
import {
  addSupportingDoc,
  getSupportingDocs,
  getEvidence,
  isFileHashRegistered,
  recordIntegrityCheck,
} from "../services/contract.service.js";

// Private key map for role-based signing
// In production this would be handled via a proper key management system
const ROLE_PRIVATE_KEYS: Record<string, string> = {
  "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc": "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a", // Forensic
  "0x90f79bf6eb2c4f870365e785982e1f101e93b906": "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6", // Lawyer
  "0x15d34aaf54267db7d7c367839aaf71a00a2c6a65": "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926b", // Judge
};

/**
 * POST /api/supporting-docs/upload
 * Role: Forensic or Lawyer
 *
 * Upload flow:
 * 1. Receive file + evidenceId + docType
 * 2. Generate SHA-256 hash
 * 3. Check duplicate
 * 4. Upload to IPFS
 * 5. Register on-chain linked to parent evidenceId
 */
export async function uploadSupportingDoc(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: "No file uploaded" });
      return;
    }

    const evidenceId = parseInt(req.body.evidenceId, 10);
    if (isNaN(evidenceId) || evidenceId <= 0) {
      res.status(400).json({
        success: false,
        error: "evidenceId must be a positive integer",
      });
      return;
    }

    const { docType } = req.body;
    if (!docType) {
      res.status(400).json({
        success: false,
        error: "docType is required (e.g. forensic_report, court_filing)",
      });
      return;
    }

    // Verify parent evidence exists
    await getEvidence(evidenceId);

    const { buffer, originalname } = req.file;

    // Step 1: Hash
    const fileHash = generateFileHash(buffer);
    console.log(`[SupportingDoc] SHA-256: ${fileHash}`);

    // Step 2: Duplicate check
    const isDuplicate = await isFileHashRegistered(fileHash);
    if (isDuplicate) {
      res.status(409).json({
        success: false,
        error: "This file has already been registered on-chain",
        fileHash,
      });
      return;
    }

    // Step 3: Upload to IPFS
    console.log(`[SupportingDoc] Uploading to IPFS: ${originalname}`);
    const ipfsCID = await uploadToIPFS(buffer, originalname);
    console.log(`[SupportingDoc] CID: ${ipfsCID}`);

    // Step 4: Get signer private key for this wallet
    const walletAddress = req.user?.walletAddress.toLowerCase() ?? "";
    const signerPrivateKey = ROLE_PRIVATE_KEYS[walletAddress];

    if (!signerPrivateKey) {
      res.status(403).json({
        success: false,
        error: "No signing key found for your wallet address",
      });
      return;
    }

    // Step 5: Register on-chain
    console.log(`[SupportingDoc] Registering on-chain for evidenceId: ${evidenceId}`);
    const txHash = await addSupportingDoc(
      evidenceId,
      ipfsCID,
      fileHash,
      docType,
      signerPrivateKey
    );
    console.log(`[SupportingDoc] TX: ${txHash}`);

    res.status(201).json({
      success: true,
      message: "Supporting document uploaded and registered on-chain",
      data: {
        evidenceId,
        docType,
        ipfsCID,
        fileHash,
        txHash,
        filename: originalname,
        uploadedBy: req.user?.walletAddress,
        ipfsUrl: `https://gateway.pinata.cloud/ipfs/${ipfsCID}`,
      },
    });
  } catch (error) {
    console.error("[SupportingDoc] Upload failed:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
}

/**
 * GET /api/supporting-docs/:evidenceId
 * Role: All authenticated users
 */
export async function getSupportingDocsByEvidence(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const evidenceId = parseInt(req.params.evidenceId, 10);
    if (isNaN(evidenceId) || evidenceId <= 0) {
      res.status(400).json({
        success: false,
        error: "evidenceId must be a positive integer",
      });
      return;
    }

    const docs = await getSupportingDocs(evidenceId);

    res.status(200).json({
      success: true,
      data: docs.map((doc) => ({
        docId: doc.docId.toString(),
        evidenceId: doc.evidenceId.toString(),
        ipfsCID: doc.ipfsCID,
        fileHash: doc.fileHash,
        uploadedBy: doc.uploadedBy,
        timestamp: doc.timestamp.toString(),
        docType: doc.docType,
        ipfsUrl: `https://gateway.pinata.cloud/ipfs/${doc.ipfsCID}`,
      })),
    });
  } catch (error) {
    console.error("[SupportingDoc] Fetch failed:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
}

/**
 * POST /api/supporting-docs/verify/:evidenceId
 * Role: Forensic or Judge
 *
 * Verifies integrity of evidence by recomputing SHA-256
 * and comparing against on-chain hash.
 */
export async function verifyEvidenceIntegrity(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: "No file uploaded" });
      return;
    }

    const evidenceId = parseInt(req.params.evidenceId, 10);
    if (isNaN(evidenceId) || evidenceId <= 0) {
      res.status(400).json({
        success: false,
        error: "evidenceId must be a positive integer",
      });
      return;
    }

    // Get on-chain evidence record
    const evidence = await getEvidence(evidenceId);

    // Recompute hash from uploaded file
    const computedHash = generateFileHash(req.file.buffer);

    // Compare against on-chain hash
    const passed = computedHash === evidence.fileHash;

    // Get signer private key
    const walletAddress = req.user?.walletAddress.toLowerCase() ?? "";
    const signerPrivateKey = ROLE_PRIVATE_KEYS[walletAddress];

    if (!signerPrivateKey) {
      res.status(403).json({
        success: false,
        error: "No signing key found for your wallet address",
      });
      return;
    }

    // Record integrity check on-chain
    const txHash = await recordIntegrityCheck(
      evidenceId,
      passed,
      signerPrivateKey
    );

    console.log(
      `[Integrity] evidenceId ${evidenceId} — ${passed ? "PASSED ✅" : "FAILED ❌"} — TX: ${txHash}`
    );

    res.status(200).json({
      success: true,
      data: {
        evidenceId,
        passed,
        computedHash,
        onChainHash: evidence.fileHash,
        verifiedBy: req.user?.walletAddress,
        txHash,
        message: passed
          ? "Integrity verified — file matches on-chain hash"
          : "Integrity check FAILED — file does not match on-chain hash",
      },
    });
  } catch (error) {
    console.error("[Integrity] Verification failed:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
}