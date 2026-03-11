import { network } from "hardhat";
import fs from "fs";
import path from "path";

// ── Hardhat v3: ethers comes from network.connect(), not from "hardhat" directly
const { ethers, networkName } = await network.connect();

async function main() {
  // ── Network info ─────────────────────────────────────────────────────────────
  const { chainId } = await ethers.provider.getNetwork();
  console.log(`\n🌐 Network   : ${networkName}`);
  console.log(`🔗 Chain ID  : ${chainId}`);

  // ── Signer ───────────────────────────────────────────────────────────────────
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`\n👤 Deployer  : ${deployer.address}`);
  console.log(`💰 Balance   : ${ethers.formatEther(balance)} ETH`);

  // ── Deploy ───────────────────────────────────────────────────────────────────
  console.log("\n🚀 Deploying EvidenceRegistry...");

  const contract = await ethers.deployContract("EvidenceRegistry");

  console.log("⏳ Waiting for deployment to confirm...");
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log(`✅ Deployed to: ${contractAddress}`);

  // ── Post-deployment sanity check ──────────────────────────────────────────────
  const evidenceCount = await contract.evidenceCount();
  const owner = await contract.owner();
  const deployerRole = await contract.getRole(deployer.address);

  console.log(`\n🔍 Sanity check:`);
  console.log(`   owner              : ${owner}`);
  console.log(`   evidenceCount      : ${evidenceCount}`);
  console.log(`   deployer role      : ${deployerRole}`);

  // ── Save deployment info ──────────────────────────────────────────────────────
  const deploymentInfo = {
    network: networkName,
    chainId: chainId.toString(),
    contractAddress,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
  };

  const outputPath = path.resolve("deployment.json");
  fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n💾 Deployment info saved to: deployment.json`);
  console.log(JSON.stringify(deploymentInfo, null, 2));
}

main().catch((error) => {
  console.error("\n❌ Deployment failed:", error);
  process.exitCode = 1;
});