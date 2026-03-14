# 🔐 Honora — Blockchain-Based Evidence Management System

[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636?logo=solidity)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-v3.1.10-yellow)](https://hardhat.org/)
[![Node.js](https://img.shields.io/badge/Node.js-v22-green?logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb)](https://www.mongodb.com/)
[![IPFS](https://img.shields.io/badge/IPFS-Pinata-65C2CB)](https://pinata.cloud/)
[![Network](https://img.shields.io/badge/Network-Sepolia%20Testnet-blue)](https://sepolia.etherscan.io/address/0xf4e1c0179acC2A54C195e8687621ee070be06B3C)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)

> A secure, tamper-proof evidence management system built on the Ethereum blockchain. Evidence files are stored on IPFS, metadata is anchored on-chain, and role-based access control ensures only authorized personnel can interact with the system.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Role-Based Access Control](#role-based-access-control)
- [Smart Contract](#smart-contract)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Deployment](#deployment)
- [Important Notes](#important-notes)
- [Roadmap](#roadmap)
- [Team](#team)

---

## Overview

Honora is a university mini-project that demonstrates how blockchain technology can be used to secure digital evidence in law enforcement. The system ensures:

- **Immutability** — Evidence records cannot be altered once registered on-chain
- **Transparency** — Full chain-of-custody history is publicly verifiable on Etherscan
- **Integrity** — SHA-256 file hashing detects any tampering with evidence files
- **Access Control** — Role-based permissions ensure only authorized roles can perform specific actions
- **Decentralized Storage** — Files are stored on IPFS via Pinata, not on a centralized server

### Live Deployment

| Network | Contract Address | Explorer |
|---|---|---|
| Ethereum Sepolia Testnet | `0xf4e1c0179acC2A54C195e8687621ee070be06B3C` | [View on Etherscan](https://sepolia.etherscan.io/address/0xf4e1c0179acC2A54C195e8687621ee070be06B3C) |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                            │
│              React Frontend  +  FastAPI AI Service              │
└─────────────────────────┬───────────────────────────────────────┘
                          │ HTTP / REST
┌─────────────────────────▼───────────────────────────────────────┐
│                      Backend Layer                              │
│         Node.js + Express + JWT Auth + Role Middleware          │
│                      (localhost:3000)                           │
└──────────┬──────────────────────────────┬───────────────────────┘
           │ ethers.js v6                 │ Mongoose
┌──────────▼──────────┐      ┌────────────▼────────────────────┐
│   Blockchain Layer  │      │        Storage Layer             │
│  Ethereum Hardhat   │      │  IPFS via Pinata (files)         │
│  local / Sepolia    │      │  MongoDB Atlas (metadata/users)  │
└─────────────────────┘      └─────────────────────────────────┘
```

### Evidence Upload Flow

```
Police uploads file
        ↓
Backend receives file (multer)
        ↓
1. Generate SHA-256 hash
2. Check for duplicate hash on-chain
3. Upload file to IPFS (Pinata) → get CID
4. Register evidence on-chain → get TX hash
5. Save enriched metadata to MongoDB
        ↓
Return: evidenceId, ipfsCID, fileHash, txHash, ipfsUrl
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contract | Solidity 0.8.24 |
| Blockchain Framework | Hardhat v3.1.10 |
| Contract Interaction | ethers.js v6 |
| Backend | Node.js v22 + Express |
| Language | TypeScript (ESM) |
| Authentication | JWT (HS256) + bcrypt (12 rounds) |
| Database | MongoDB Atlas (Mongoose) |
| File Storage | IPFS via Pinata |
| File Hashing | SHA-256 |
| AI Layer | FastAPI + Qdrant + Legal-BERT *(in development)* |
| Frontend | React *(in development)* |

---

## Features

### ✅ Phase 1 — Core Evidence Management
- Upload evidence files to IPFS with SHA-256 integrity hashing
- Register evidence metadata on-chain (immutable)
- Retrieve evidence by ID with full metadata
- Transfer chain-of-custody between authorized wallets
- Full custody history recorded on-chain
- Duplicate file detection via on-chain hash registry

### ✅ Phase 2 — RBAC + Authentication
- JWT-based authentication (register/login)
- Role-based access control (Police, Forensic, Lawyer, Judge)
- Upload supporting documents linked to evidence
- Integrity verification — recompute SHA-256 and compare against on-chain hash
- MongoDB user management with bcrypt password hashing
- Role enforcement middleware returning clear 403 errors

### ✅ Phase 3 — Metadata Enrichment
- MongoDB evidence collection stores `caseName`, `department`, `filename`
- Merged on-chain + off-chain data in single API response
- Supporting document metadata stored in MongoDB

### ✅ Phase 4 — Testnet Deployment
- Contract deployed and verified on Ethereum Sepolia testnet
- Publicly verifiable on Etherscan

### 🔲 Phase 5 — AI Layer *(In Development)*
- Semantic search across evidence using Legal-BERT embeddings
- Cross-case linkage detection (similarity threshold: 0.85)
- Qdrant vector database with RBAC-filtered search
- FastAPI microservice running independently on port 8000

### 🔲 Phase 6 — Frontend *(In Development)*
- React dashboard for all roles
- Evidence upload, search, and verification UI
- Custody history timeline visualization

---

## Role-Based Access Control

| Action | Police | Forensic | Lawyer | Judge |
|---|:---:|:---:|:---:|:---:|
| Upload evidence | ✅ | ❌ | ❌ | ❌ |
| Upload supporting docs | ❌ | ✅ | ✅ | ❌ |
| View evidence | ✅ | ✅ | ✅ | ✅ |
| Verify integrity | ❌ | ✅ | ❌ | ✅ |
| Transfer custody | ✅ | ✅ | ❌ | ❌ |
| Assign roles | ❌ | ❌ | ❌ | ❌ |

> Role assignment is restricted to the contract owner (deployer wallet) only.

---

## Smart Contract

**File:** `contracts/EvidenceRegistry.sol`

### Key Functions

| Function | Access | Description |
|---|---|---|
| `addEvidence(caseId, ipfsCID, fileHash)` | Police | Register new evidence on-chain |
| `addSupportingDoc(evidenceId, ipfsCID, fileHash, docType)` | Forensic, Lawyer | Link supporting document to evidence |
| `transferCustody(evidenceId, newHolder)` | Police, Forensic | Transfer evidence to new holder |
| `recordIntegrityCheck(evidenceId, passed)` | Forensic, Judge | Record integrity verification result |
| `assignRole(address, role)` | Owner | Assign role to wallet address |
| `revokeRole(address)` | Owner | Revoke role from wallet address |
| `getEvidence(evidenceId)` | View | Fetch evidence record |
| `getCustodyHistory(evidenceId)` | View | Fetch full custody chain |
| `getSupportingDocs(evidenceId)` | View | Fetch all supporting documents |
| `isFileHashRegistered(fileHash)` | View | Check for duplicate files |

---

## API Endpoints

All endpoints except `/api/auth/*` require `Authorization: Bearer <token>` header.

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and receive JWT token |

**Register body:**
```json
{
  "name": "Officer John",
  "email": "john@police.gov",
  "password": "yourpassword",
  "role": "Police",
  "walletAddress": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
}
```

### Evidence
| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/api/evidence/upload` | Police | Upload file + register on-chain |
| GET | `/api/evidence/:id` | All | Get evidence + metadata |
| GET | `/api/evidence/:id/history` | All | Get custody history |

**Upload form-data fields:**

| Key | Type | Description |
|---|---|---|
| `file` | File | Evidence file |
| `caseId` | Text | Case number |
| `caseName` | Text | e.g. "State v. Richardson" |
| `department` | Text | e.g. "financial-crimes" |

### Supporting Documents
| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/api/supporting-docs/upload` | Forensic, Lawyer | Upload supporting document |
| GET | `/api/supporting-docs/:evidenceId` | All | Get supporting docs |
| POST | `/api/supporting-docs/verify/:evidenceId` | Forensic, Judge | Verify file integrity |

### Custody
| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/api/custody/transfer` | Police, Forensic | Transfer custody |

### Example Response — GET /api/evidence/:id
```json
{
  "success": true,
  "data": {
    "evidenceId": "1",
    "caseId": "2",
    "caseName": "State v. Richardson",
    "department": "financial-crimes",
    "filename": "evidence.jpg",
    "ipfsCID": "bafkrei...",
    "fileHash": "8597a983...",
    "uploadedBy": "0x70997970...",
    "timestamp": "1773501720",
    "currentHolder": "0x70997970...",
    "ipfsUrl": "https://gateway.pinata.cloud/ipfs/bafkrei..."
  }
}
```

---

## Project Structure

```
EMS Backend and Blockchain/
├── contracts/
│   └── EvidenceRegistry.sol          # Main smart contract with RBAC
├── scripts/
│   ├── setup.ts                      # One-command: deploy + assign all roles
│   ├── deploy.ts                     # Local deployment only
│   ├── deploy-sepolia.ts             # Sepolia testnet deployment
│   └── assignRole.ts                 # Standalone role assignment
├── backend/
│   └── src/
│       ├── config/
│       │   ├── env.ts                # Environment variable loader
│       │   └── db.ts                 # MongoDB connection
│       ├── models/
│       │   ├── user.model.ts         # User schema (MongoDB)
│       │   └── evidence.model.ts     # Evidence + SupportingDoc schemas
│       ├── middleware/
│       │   ├── auth.middleware.ts    # JWT verification
│       │   ├── role.middleware.ts    # Role-based access control
│       │   └── upload.middleware.ts  # Multer file upload handler
│       ├── services/
│       │   ├── contract.service.ts   # All blockchain interactions
│       │   ├── hash.service.ts       # SHA-256 file hashing
│       │   ├── pinata.service.ts     # IPFS file upload via Pinata
│       │   └── auth.service.ts       # Register/login business logic
│       ├── controllers/
│       │   ├── auth.controller.ts
│       │   ├── evidence.controller.ts
│       │   ├── custody.controller.ts
│       │   └── supportingDoc.controller.ts
│       ├── routes/
│       │   ├── auth.routes.ts
│       │   ├── evidence.routes.ts
│       │   ├── custody.routes.ts
│       │   └── supportingDoc.routes.ts
│       └── app.ts                    # Express app entry point
├── hardhat.config.ts
├── package.json
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js v22+
- npm
- Git

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/Adwaith-R-Nair/Honora---Backend-Blockchain.git
cd Honora---Backend-Blockchain
```

**2. Install root dependencies**
```bash
npm install
```

**3. Install backend dependencies**
```bash
cd backend && npm install && cd ..
```

**4. Set up environment variables**

Create `backend/.env`:
```env
PINATA_JWT=your_pinata_jwt_here
RPC_URL=http://127.0.0.1:8545
CONTRACT_ADDRESS=                        # filled after running setup.ts
PRIVATE_KEY=0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=24h
```

Create root `.env` (for Sepolia deployment only):
```env
SEPOLIA_RPC_URL=your_alchemy_sepolia_url
SEPOLIA_PRIVATE_KEY=your_wallet_private_key
```

**5. Compile the smart contract**
```bash
npx hardhat compile
```

### Running Locally

**Terminal 1 — Start Hardhat node:**
```bash
npx hardhat node
```

**Terminal 2 — Deploy contract + assign roles (one command):**
```bash
npx hardhat run scripts/setup.ts --network localhost
```
Copy the `CONTRACT_ADDRESS` from the output and paste it into `backend/.env`.

**Terminal 3 — Start backend:**
```bash
cd backend
npm run dev
```

Backend runs at `http://localhost:3000`

Health check: `http://localhost:3000/health`

---

## Deployment

### Sepolia Testnet

**1. Get free Sepolia ETH** from [Google's faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia)

**2. Set up root `.env`** with your Alchemy RPC URL and wallet private key

**3. Deploy:**
```bash
npx hardhat run scripts/deploy-sepolia.ts --network sepolia
```

**Live deployment:**
```
Network  : Ethereum Sepolia Testnet
Chain ID : 11155111
Address  : 0xf4e1c0179acC2A54C195e8687621ee070be06B3C
Deployer : 0x22B02554A3Bc11825B4D2Bbb9AB9C4E694587c70
Etherscan: https://sepolia.etherscan.io/address/0xf4e1c0179acC2A54C195e8687621ee070be06B3C
```

---

## Important Notes

- **Local blockchain resets** every time `npx hardhat node` restarts — all on-chain data is wiped
- Run `setup.ts` after every node restart to redeploy and reassign roles
- **MongoDB and IPFS data persists** across node restarts — only blockchain state is lost
- Never commit `.env` files to GitHub — they are gitignored
- The `PRIVATE_KEY` in `backend/.env` for local dev is Hardhat Account #1 (deterministic test wallet, not real)

---

## Roadmap

| Phase | Feature | Status |
|---|---|---|
| 1 | Smart contract + IPFS + Backend API | ✅ Complete |
| 2 | RBAC + JWT Auth + MongoDB + Supporting Docs | ✅ Complete |
| 3 | MongoDB metadata enrichment (caseName, department) | ✅ Complete |
| 4 | Sepolia testnet deployment | ✅ Complete |
| 5 | AI Layer — semantic search + cross-case linkage | 🔲 In Development |
| 6 | React Frontend — dashboard for all roles | 🔲 In Development |
| 7 | Final documentation + submission | 🔲 Pending |

---

## Team

| Name | Responsibility |
|---|---|
| Adwaith R Nair | Blockchain + Backend |
| Diya | AI Layer (FastAPI + Qdrant + Legal-BERT) |
| Abhi | Frontend (React) |
| Meghna | Frontend (React) |

---
