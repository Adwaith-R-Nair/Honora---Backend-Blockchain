import hre from "hardhat";
import { ethers } from "ethers";

async function main() {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const signer = await provider.getSigner(0);

  const artifact = await hre.artifacts.readArtifact("EvidenceRegistry");

  const contract = new ethers.Contract(
    "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    artifact.abi,
    signer
  );

  const tx = await contract.addEvidence(
    1,
    "QmExampleCID123",
    "0xabc123hash"
  );

  await tx.wait();

  console.log("Evidence added!");

  const evidence = await contract.getEvidence(1);

  console.log("Evidence Details:", evidence);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});