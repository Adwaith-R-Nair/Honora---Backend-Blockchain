import hre from "hardhat";
import { ethers } from "ethers";

async function main() {
  // Connect to Hardhat local node
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

  // Get first signer (Account #0)
  const signer = await provider.getSigner(0);

  // Read compiled contract artifact
  const artifact = await hre.artifacts.readArtifact("EvidenceRegistry");

  // Create contract factory
  const factory = new ethers.ContractFactory(
    artifact.abi,
    artifact.bytecode,
    signer
  );

  // Deploy contract
  const contract = await factory.deploy();

  await contract.waitForDeployment();

  console.log("EvidenceRegistry deployed to:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});