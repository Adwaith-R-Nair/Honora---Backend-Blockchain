import express from "express";
import multer from "multer";
import { generateSHA256 } from "../services/hashService.js";
import { uploadToIPFS } from "../services/ipfsService.js";
import { getContract } from "../config/blockchain.js";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({storage});

router.post("/upload", upload.single("file"), async (req, res) => {
  
  try {

    console.log("req.file:", req.file);
    console.log("req.body:", req.body);

    if (!req.file) {
      return res.status(400).json({ error: "File not received" });
    }

    const fileBuffer = req.file.buffer;
    const caseId = req.body.caseId;

    
    const fileHash = generateSHA256(fileBuffer);

    
    const cid = await uploadToIPFS(fileBuffer, req.file.originalname);

    
    const contract = await getContract();
    const tx = await contract.addEvidence(caseId, cid, fileHash);

    await tx.wait();

    res.json({
      success: true,
      message: "Evidence stored successfully",
      ipfsCID: cid,
      fileHash,
      transactionHash: tx.hash
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Upload failed" });
  }
});

export default router;

const contract = await ethers.getContractAt(
  "EvidenceRegistry",
  "0x5FbDB2315678afecb367f032d93F642f64180aa3"
)