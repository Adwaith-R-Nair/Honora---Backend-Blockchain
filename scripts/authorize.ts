import { network } from "hardhat";
import { readFileSync } from "fs";
import { resolve } from "path";

// ── Hardhat v3: ethers comes from network.connect()
const { ethers } = await network.connect();

async function main() {
  // ── Signers ───────────────────────────────────────────────────────────────────
  // Account #0 = contract owner (deployed the contract)
  // Account #1 = dedicated backend signer (will upload evidence)
  const [owner, backendSigner] = await ethers.getSigners();

  console.log(`\n👤 Owner (Account #0)         : ${owner.address}`);
  console.log(`🔧 Backend Signer (Account #1) : ${backendSigner.address}`);

  // ── Load deployment info + artifact via fs (avoids JSON import assertion) ─────
  const deploymentInfo = JSON.parse(
    readFileSync(resolve("deployment.json"), "utf-8")
  );

  const artifact = JSON.parse(
    readFileSync(
      resolve("artifacts/contracts/EvidenceRegistry.sol/EvidenceRegistry.json"),
      "utf-8"
    )
  );

  // ── Attach to deployed contract ───────────────────────────────────────────────
  const contract = new ethers.Contract(
    deploymentInfo.contractAddress,
    artifact.abi,
    owner // owner signs this transaction
  );

  console.log(`\n📄 Contract address: ${deploymentInfo.contractAddress}`);

  // ── Check if already authorized ───────────────────────────────────────────────
  const alreadyAuthorized = await contract.isAuthorized(backendSigner.address);

  if (alreadyAuthorized) {
    console.log(`\n✅ Account #1 is already authorized. Nothing to do.`);
    return;
  }

  // ── Authorize Account #1 ──────────────────────────────────────────────────────
  console.log(`\n🚀 Authorizing Account #1 as uploader...`);

  const tx = await contract.authorizeUploader(backendSigner.address);
  console.log(`⏳ Transaction sent: ${tx.hash}`);

  await tx.wait();
  console.log(`✅ Transaction confirmed.`);

  // ── Verify ────────────────────────────────────────────────────────────────────
  const isNowAuthorized = await contract.isAuthorized(backendSigner.address);
  console.log(`\n🔍 Verification:`);
  console.log(`   Account #1 authorized: ${isNowAuthorized}`);

  if (!isNowAuthorized) {
    throw new Error("Authorization failed — isAuthorized still false after tx");
  }

  console.log(`\n🎉 Account #1 is now authorized to upload evidence.`);
  console.log(`   Address : ${backendSigner.address}`);
  console.log(
    `   Use the private key of this account as PRIVATE_KEY in backend/.env`
  );
}

main().catch((error) => {
  console.error("\n❌ Authorization failed:", error);
  process.exitCode = 1;
});