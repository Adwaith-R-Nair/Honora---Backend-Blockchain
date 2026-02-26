# 🔐 Honora – Blockchain Evidence Management System (Phase 1)

Honora is a decentralized Evidence Management System built using:

- 🧱 Solidity Smart Contracts (Hardhat)
- 🗂 IPFS (Pinata)
- ⚡ Node.js + Express Backend
- 🔗 Ethers v6
- 🧪 Local Hardhat Blockchain

This system ensures:
- Tamper-proof evidence storage
- Decentralized file hosting via IPFS
- Immutable metadata stored on blockchain
- Transparent chain-of-custody tracking

---

# 🏗 Project Architecture

User Uploads File  
        ↓  
Backend (Node.js)  
        ↓  
1️⃣ Generate SHA-256 Hash  
2️⃣ Upload file to IPFS (Pinata)  
3️⃣ Store metadata on Blockchain  
        ↓  
Return:
- IPFS CID
- File Hash
- Transaction Hash

---

# 📁 Project Structure

```
EMS Backend and Blockchain/
│
├── backend/                 # Express Backend
│   ├── routes/
│   ├── services/
│   ├── config/
│   └── server.js
│
├── contracts/               # Solidity Smart Contracts
│   └── EvidenceRegistry.sol
│
├── scripts/                 # Hardhat Scripts
│   ├── deploy.ts
│   └── interact.ts
│
├── hardhat.config.ts
├── package.json
└── README.md
```

---

# ⚙️ Complete Installation Guide (Step-by-Step)

This guide assumes Windows/macOS/Linux with Node.js installed.

---

## 🔹 0️⃣ Prerequisites

Install the following:

- Node.js **v22 LTS or later**
- npm (comes with Node)
- Git

Check versions:

```bash
node -v
npm -v
git --version
```

---

## 🔹 1️⃣ Clone Repository

```bash
git clone https://github.com/Adwaith-R-Nair/Honora---Backend-Blockchain.git
cd Honora---Backend-Blockchain
```

---

# 🧱 HARDHAT + SMART CONTRACT SETUP

---

## 🔹 2️⃣ Install Hardhat Dependencies (Root Folder)

From the root folder:

```bash
npm install
```

This installs:

- hardhat
- typescript
- @nomicfoundation/hardhat-ethers
- ethers v6
- all contract dependencies

---

## 🔹 3️⃣ Compile Smart Contracts

```bash
npx hardhat compile
```

This generates:

- artifacts/
- cache/

---

# 🖥 BACKEND SETUP

---

## 🔹 4️⃣ Install Backend Dependencies

Move into backend folder:

```bash
cd backend
npm install
```

This installs:

- express
- multer
- axios
- ethers
- dotenv
- form-data
- crypto
- cors

Then return to root:

```bash
cd ..
```

---

# 🔐 ENVIRONMENT CONFIGURATION

---

## 🔹 5️⃣ Create .env File

Inside:

```
backend/.env
```

Add:

```
PINATA_JWT=your_pinata_jwt_here
CONTRACT_ADDRESS=will_be_added_after_deployment
```

⚠️ Never push `.env` to GitHub.

---

# 🚀 RUNNING THE PROJECT

You need **3 terminals**.

---

## 🟢 Terminal 1 – Start Local Blockchain

```bash
npx hardhat node
```

This starts local blockchain at:

```
http://127.0.0.1:8545
```

---

## 🟢 Terminal 2 – Deploy Smart Contract

```bash
npx hardhat run scripts/deploy.ts --network localhost
```

After deployment:

Copy the contract address printed.

Update:

```
backend/.env
```

Add:

```
CONTRACT_ADDRESS=your_new_contract_address
```

Restart backend after updating.

---

## 🟢 Terminal 3 – Start Backend Server

```bash
cd backend
node server.js
```

Backend runs at:

```
http://localhost:5000
```

---

# 📤 API Endpoint

## Upload Evidence

**POST**
```
http://localhost:5000/api/evidence/upload
```

### Body (form-data):

| Key     | Type  |
|----------|--------|
| caseId   | Text   |
| file     | File   |

---

# ✅ Successful Response Example

```json
{
  "success": true,
  "message": "Evidence stored successfully",
  "ipfsCID": "Qm...",
  "fileHash": "abc123...",
  "transactionHash": "0x..."
}
```

---

# 🔒 Security Features (Phase 1)

✔ SHA-256 hashing  
✔ IPFS decentralized storage  
✔ Immutable blockchain metadata  
✔ Chain-of-custody tracking  
✔ Transaction-level transparency  

---

# 🛣 Roadmap

## Phase 1 (Completed)
- Core Smart Contract
- Backend Integration
- IPFS Storage
- Blockchain Storage

## Phase 2 (Planned)
- Agentic AI Evidence Analysis
- Integrity Monitoring Agent
- Role-based Access Control
- Testnet Deployment

---

# ⚠️ Important Notes

- Local blockchain resets when `hardhat node` restarts
- Contract must be redeployed after each restart
- Update `.env` accordingly

---

# 📌 Tech Stacks

Solidity  
Hardhat v3  
Ethers v6  
Node.js  
Express  
IPFS (Pinata)

---

# 🔥 Status

Phase 1 – Fully Functional MVP