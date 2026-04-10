import type { Request, Response } from "express";
import { transferCustody } from "../services/contract.service.js";
import { ethers } from "ethers";

/**
 * POST /api/custody/transfer
 * Role: Police or Forensic
 *
 * Transfers custody of evidence to a new holder.
 * The backend signer must be the current holder on-chain.
 *
 * Request body:
 * {
 *   "evidenceId": 1,
 *   "newHolder": "0x..."
 * }
 */
export async function transferEvidenceCustody(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { evidenceId, newHolder } = req.body;

    const parsedId = parseInt(evidenceId, 10);
    if (isNaN(parsedId) || parsedId <= 0) {
      res.status(400).json({
        success: false,
        error: "evidenceId must be a positive integer",
      });
      return;
    }

    if (!newHolder || !ethers.isAddress(newHolder)) {
      res.status(400).json({
        success: false,
        error: "newHolder must be a valid Ethereum address",
      });
      return;
    }

    console.log(
      `[Custody] ${req.user?.role} (${req.user?.walletAddress}) transferring evidenceId ${parsedId} to ${newHolder}`
    );

    const txHash = await transferCustody(parsedId, newHolder, req.user?.role ?? "Police");
    console.log(`[Custody] TX: ${txHash}`);

    res.status(200).json({
      success: true,
      message: "Custody transferred successfully",
      data: {
        evidenceId: parsedId,
        transferredBy: req.user?.walletAddress,
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