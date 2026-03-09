import { PinataSDK } from "pinata";
import { ENV } from "../config/env.js";

// Initialise Pinata client once
const pinata = new PinataSDK({
  pinataJwt: ENV.PINATA_JWT,
});

/**
 * Uploads a file buffer to IPFS via Pinata.
 * The actual evidence file never touches the blockchain —
 * only the returned CID is stored on-chain.
 *
 * @param buffer   - Raw file buffer from multer memory storage
 * @param filename - Original filename (used as the Pinata pin name)
 * @returns IPFS CID string
 */
export async function uploadToIPFS(
  buffer: Buffer,
  filename: string
): Promise<string> {
  // Convert buffer to a File object for the Pinata SDK
  const file = new File([buffer], filename, { type: "application/octet-stream" });

  const result = await pinata.upload.public.file(file);

  if (!result.cid) {
    throw new Error("Pinata upload succeeded but returned no CID");
  }

  return result.cid;
}