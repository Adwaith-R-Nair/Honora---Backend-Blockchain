import { network } from "hardhat";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

/**
 * setup.ts — One-command local development setup
 *
 * Deploys EvidenceRegistry + assigns all roles in a single run.
 * Run this every time you restart the Hardhat node:
 *
 *   npx hardhat run scripts/setup.ts --network localhost
 *
 * Then update backend/.env with the new CONTRACT_ADDRESS.
 */

const ROLES = [
  { account: 1, role: 1, roleName: "Police" },
  { account: 2, role: 2, roleName: "Forensic" },
  { account: 3, role: 3, roleName: "Lawyer" },
  { account: 4, role: 4, roleName: "Judge" },
];

async function main() {
  const { ethers } = await network.connect();

  const signers = await ethers.getSigners();
  const deployer = signers[0];

  console.log("\n╔════════════════════════════════════════════════╗");
  console.log("║         EMS — Local Development Setup          ║");
  console.log("╚════════════════════════════════════════════════╝\n");

  console.log(`🌐 Network   : localhost`);
  console.log(`🔗 Chain ID  : ${(await ethers.provider.getNetwork()).chainId}`);
  console.log(`👤 Deployer  : ${deployer.address}`);
  console.log(`💰 Balance   : ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  // ── Step 1: Deploy ──────────────────────────────────────────────────────────
  console.log("📦 Step 1 — Deploying EvidenceRegistry...");

  const artifactPath = resolve(
    "artifacts/contracts/EvidenceRegistry.sol/EvidenceRegistry.json"
  );
  const artifact = JSON.parse(readFileSync(artifactPath, "utf-8"));

  const factory = new ethers.ContractFactory(
    artifact.abi,
    artifact.bytecode,
    deployer
  );

  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log(`✅ Deployed to: ${contractAddress}\n`);

  // ── Step 2: Save deployment.json ───────────────────────────────────────────
  const deploymentInfo = {
    network: "localhost",
    chainId: "31337",
    contractAddress,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
  };

  writeFileSync("deployment.json", JSON.stringify(deploymentInfo, null, 2));
  console.log(`💾 deployment.json updated\n`);

  // ── Step 3: Assign roles ───────────────────────────────────────────────────
  console.log("🔐 Step 2 — Assigning roles...\n");

  for (const { account, role, roleName } of ROLES) {
    const address = signers[account].address;
    const tx = await (contract as any).assignRole(address, role);
    await tx.wait();
    console.log(`   ✅ ${roleName.padEnd(10)} → ${address}`);
  }

  // ── Step 4: Print summary ──────────────────────────────────────────────────
  console.log("\n╔════════════════════════════════════════════════╗");
  console.log("║                    Summary                     ║");
  console.log("╚════════════════════════════════════════════════╝\n");

  console.log(`  Contract : ${contractAddress}`);
  console.log(`  Owner    : ${signers[0].address}`);
  console.log(`  Police   : ${signers[1].address}`);
  console.log(`  Forensic : ${signers[2].address}`);
  console.log(`  Lawyer   : ${signers[3].address}`);
  console.log(`  Judge    : ${signers[4].address}`);

  console.log("\n┌─────────────────────────────────────────────────────┐");
  console.log("│  Update backend/.env with:                          │");
  console.log(`│  CONTRACT_ADDRESS=${contractAddress}  │`);
  console.log("└─────────────────────────────────────────────────────┘\n");
}

main().catch((error) => {
  console.error("❌ Setup failed:", error);
  process.exit(1);
});