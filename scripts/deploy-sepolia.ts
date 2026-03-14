import { network } from "hardhat";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import * as dotenv from "dotenv";

// Load root .env
dotenv.config();

/**
 * deploy-sepolia.ts — Deploy EvidenceRegistry to Sepolia testnet
 *
 * Run with:
 *   npx hardhat run scripts/deploy-sepolia.ts --network sepolia
 *
 * After deployment:
 * 1. Copy the contract address from the output
 * 2. Update backend/.env with SEPOLIA_CONTRACT_ADDRESS
 * 3. Verify on Etherscan: https://sepolia.etherscan.io/address/<CONTRACT_ADDRESS>
 */

async function main() {
  const { ethers } = await network.connect();

  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  const networkInfo = await ethers.provider.getNetwork();

  console.log("\n╔════════════════════════════════════════════════╗");
  console.log("║       EMS — Sepolia Testnet Deployment         ║");
  console.log("╚════════════════════════════════════════════════╝\n");

  console.log(`🌐 Network   : Sepolia Testnet`);
  console.log(`🔗 Chain ID  : ${networkInfo.chainId}`);
  console.log(`👤 Deployer  : ${deployer.address}`);
  console.log(`💰 Balance   : ${ethers.formatEther(balance)} ETH\n`);

  // Safety check — make sure we have enough ETH for gas
  if (balance < ethers.parseEther("0.01")) {
    throw new Error("Insufficient balance. Need at least 0.01 ETH for deployment.");
  }

  // ── Load artifact ───────────────────────────────────────────────────────────
  const artifactPath = resolve(
    "artifacts/contracts/EvidenceRegistry.sol/EvidenceRegistry.json"
  );
  const artifact = JSON.parse(readFileSync(artifactPath, "utf-8"));

  // ── Deploy ──────────────────────────────────────────────────────────────────
  console.log("📦 Deploying EvidenceRegistry to Sepolia...");
  console.log("⏳ This may take 15-30 seconds...\n");

  const factory = new ethers.ContractFactory(
    artifact.abi,
    artifact.bytecode,
    deployer
  );

  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  const deployTx = contract.deploymentTransaction();

  console.log(`✅ Deployed successfully!`);
  console.log(`📄 Contract  : ${contractAddress}`);
  console.log(`🔗 TX Hash   : ${deployTx?.hash}\n`);

  // ── Save deployment info ────────────────────────────────────────────────────
  const deploymentInfo = {
    network: "sepolia",
    chainId: networkInfo.chainId.toString(),
    contractAddress,
    deployer: deployer.address,
    txHash: deployTx?.hash,
    deployedAt: new Date().toISOString(),
  };

  writeFileSync(
    "deployment-sepolia.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log(`💾 Saved to deployment-sepolia.json\n`);

  // ── Print next steps ────────────────────────────────────────────────────────
  console.log("╔════════════════════════════════════════════════╗");
  console.log("║                 Next Steps                     ║");
  console.log("╚════════════════════════════════════════════════╝\n");

  console.log(`1. Add to backend/.env:`);
  console.log(`   SEPOLIA_CONTRACT_ADDRESS=${contractAddress}\n`);

  console.log(`2. View on Etherscan:`);
  console.log(`   https://sepolia.etherscan.io/address/${contractAddress}\n`);

  console.log(`3. View deployment TX:`);
  console.log(`   https://sepolia.etherscan.io/tx/${deployTx?.hash}\n`);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exit(1);
});