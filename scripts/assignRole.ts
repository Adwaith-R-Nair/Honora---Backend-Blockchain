import { network } from "hardhat";
import { readFileSync } from "fs";
import { resolve } from "path";

// ── Hardhat v3: ethers comes from network.connect()
const { ethers } = await network.connect();

// ── Role enum mapping (must match contract)
const Role = {
  None: 0,
  Police: 1,
  Forensic: 2,
  Lawyer: 3,
  Judge: 4,
};

const RoleNames: Record<number, string> = {
  0: "None",
  1: "Police",
  2: "Forensic",
  3: "Lawyer",
  4: "Judge",
};

async function main() {
  // ── Load deployment info + artifact ──────────────────────────────────────────
  const deploymentInfo = JSON.parse(
    readFileSync(resolve("deployment.json"), "utf-8")
  );

  const artifact = JSON.parse(
    readFileSync(
      resolve("artifacts/contracts/EvidenceRegistry.sol/EvidenceRegistry.json"),
      "utf-8"
    )
  );

  // ── Signers ───────────────────────────────────────────────────────────────────
  const [owner, police, forensic, lawyer, judge] = await ethers.getSigners();

  console.log(`\n📄 Contract : ${deploymentInfo.contractAddress}`);
  console.log(`👤 Owner    : ${owner.address}\n`);

  // ── Attach to deployed contract as owner ──────────────────────────────────────
  const contract = new ethers.Contract(
    deploymentInfo.contractAddress,
    artifact.abi,
    owner
  );

  // ── Role assignments ──────────────────────────────────────────────────────────
  const assignments = [
    { account: police,   role: Role.Police,   label: "Account #1 → Police"   },
    { account: forensic, role: Role.Forensic, label: "Account #2 → Forensic" },
    { account: lawyer,   role: Role.Lawyer,   label: "Account #3 → Lawyer"   },
    { account: judge,    role: Role.Judge,    label: "Account #4 → Judge"    },
  ];

  for (const { account, role, label } of assignments) {
    // Check current role first
    const currentRole = await contract.getRole(account.address);

    if (Number(currentRole) === role) {
      console.log(`✅ ${label} — already assigned, skipping`);
      continue;
    }

    console.log(`🚀 Assigning ${label}...`);
    const tx = await contract.assignRole(account.address, role);
    await tx.wait();
    console.log(`   TX: ${tx.hash}`);

    // Verify
    const verifiedRole = await contract.getRole(account.address);
    console.log(`   Verified role: ${RoleNames[Number(verifiedRole)]}`);
    console.log(`   Address: ${account.address}\n`);
  }

  // ── Final summary ─────────────────────────────────────────────────────────────
  console.log(`\n🎉 Role Assignment Summary:`);
  console.log(`${"─".repeat(60)}`);
  console.log(`  Owner    (Account #0) : ${owner.address}`);
  console.log(`  Police   (Account #1) : ${police.address}`);
  console.log(`  Forensic (Account #2) : ${forensic.address}`);
  console.log(`  Lawyer   (Account #3) : ${lawyer.address}`);
  console.log(`  Judge    (Account #4) : ${judge.address}`);
  console.log(`${"─".repeat(60)}`);
  console.log(`\n💡 Use Account #1 private key as PRIVATE_KEY in backend/.env`);
  console.log(`   (Police role — authorized to upload evidence)\n`);
}

main().catch((error) => {
  console.error("\n❌ Role assignment failed:", error);
  process.exitCode = 1;
});