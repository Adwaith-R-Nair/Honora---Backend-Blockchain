import { ethers } from "ethers";
import { readFileSync } from "fs";
import { resolve } from "path";
import { ENV } from "../config/env.js";

// process.cwd() = backend/ when running npm run dev
// go one level up to project root, then into artifacts
const artifactPath = resolve(
  process.cwd(),
  "../artifacts/contracts/EvidenceRegistry.sol/EvidenceRegistry.json"
);

const artifact = JSON.parse(readFileSync(artifactPath, "utf-8"));

// ── Provider + Signer (Account #1 — authorized backend signer) ───────────────
const provider = new ethers.JsonRpcProvider(ENV.RPC_URL);
const signer = new ethers.Wallet(ENV.PRIVATE_KEY, provider);

// ── Contract instance ─────────────────────────────────────────────────────────
const contract = new ethers.Contract(
  ENV.CONTRACT_ADDRESS,
  artifact.abi,
  signer
);

// ── Types mirroring the Solidity structs ──────────────────────────────────────
export interface EvidenceRecord {
  evidenceId: bigint;
  caseId: bigint;
  ipfsCID: string;
  fileHash: string;
  uploadedBy: string;
  timestamp: bigint;
  currentHolder: string;
  exists: boolean;
}

export interface CustodyRecord {
  from: string;
  to: string;
  timestamp: bigint;
}

// ── Contract service functions ────────────────────────────────────────────────

/**
 * Registers new evidence on-chain.
 * Called after file is uploaded to IPFS and hashed.
 *
 * @param caseId   - Numeric case identifier
 * @param ipfsCID  - IPFS CID returned by Pinata
 * @param fileHash - SHA-256 hash of the evidence file
 * @returns Transaction hash
 */
export async function addEvidence(
  caseId: number,
  ipfsCID: string,
  fileHash: string
): Promise<string> {
  const tx = await contract.addEvidence(caseId, ipfsCID, fileHash);
  const receipt = await tx.wait();

  if (!receipt || receipt.status !== 1) {
    throw new Error("addEvidence transaction failed on-chain");
  }

  return tx.hash;
}

/**
 * Transfers custody of evidence to a new holder.
 * Only callable by the current holder (enforced by the contract).
 *
 * @param evidenceId - On-chain evidence ID
 * @param newHolder  - Ethereum address of the new custodian
 * @returns Transaction hash
 */
export async function transferCustody(
  evidenceId: number,
  newHolder: string
): Promise<string> {
  const tx = await contract.transferCustody(evidenceId, newHolder);
  const receipt = await tx.wait();

  if (!receipt || receipt.status !== 1) {
    throw new Error("transferCustody transaction failed on-chain");
  }

  return tx.hash;
}

/**
 * Retrieves evidence metadata from the contract.
 *
 * @param evidenceId - On-chain evidence ID
 * @returns EvidenceRecord struct
 */
export async function getEvidence(
  evidenceId: number
): Promise<EvidenceRecord> {
  const result = await contract.getEvidence(evidenceId);

  return {
    evidenceId: result.evidenceId,
    caseId: result.caseId,
    ipfsCID: result.ipfsCID,
    fileHash: result.fileHash,
    uploadedBy: result.uploadedBy,
    timestamp: result.timestamp,
    currentHolder: result.currentHolder,
    exists: result.exists,
  };
}

/**
 * Retrieves the full custody history for a piece of evidence.
 *
 * @param evidenceId - On-chain evidence ID
 * @returns Array of CustodyRecord structs
 */
export async function getCustodyHistory(
  evidenceId: number
): Promise<CustodyRecord[]> {
  const results = await contract.getCustodyHistory(evidenceId);

  return results.map((r: CustodyRecord) => ({
    from: r.from,
    to: r.to,
    timestamp: r.timestamp,
  }));
}

/**
 * Checks whether a file hash is already registered on-chain.
 * Used for duplicate detection before uploading.
 *
 * @param fileHash - SHA-256 hash to check
 * @returns boolean
 */
export async function isFileHashRegistered(
  fileHash: string
): Promise<boolean> {
  return await contract.isFileHashRegistered(fileHash);
}