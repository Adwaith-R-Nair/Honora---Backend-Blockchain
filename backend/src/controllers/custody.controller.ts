import type { Request, Response } from "express";
import { transferCustody } from "../services/contract.service.js";
import { ethers } from "ethers";

/**
 * POST /api/custody/transfer
 *
 * Transfers custody of a registered evidence item to a new holder.
 *
 * Request body:
 * {
 *   "evidenceId": 1,
 *   "newHolder": "0x..."
 * }
 *
 * The backend signer (Account #1) must be the current holder
 * for this transaction to succeed on-chain.
 */
export async function transferEvidenceCustody(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { evidenceId, newHolder } = req.body;

    // ── Validate evidenceId ─────────────────────────────────────────────────────
    const parsedId = parseInt(evidenceId, 10);
    if (isNaN(parsedId) || parsedId <= 0) {
      res.status(400).json({
        success: false,
        error: "evidenceId must be a positive integer",
      });
      return;
    }

    // ── Validate newHolder address ──────────────────────────────────────────────
    if (!newHolder || !ethers.isAddress(newHolder)) {
      res.status(400).json({
        success: false,
        error: "newHolder must be a valid Ethereum address",
      });
      return;
    }

    // ── Execute on-chain transfer ───────────────────────────────────────────────
    console.log(
      `[Custody] Transferring evidenceId ${parsedId} to ${newHolder}`
    );
    const txHash = await transferCustody(parsedId, newHolder);
    console.log(`[Custody] Transaction hash: ${txHash}`);

    res.status(200).json({
      success: true,
      message: "Custody transferred successfully",
      data: {
        evidenceId: parsedId,
        newHolder,
        txHash,
      },
    });
  } catch (error) {
    console.error("[Custody] Transfer failed:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
}