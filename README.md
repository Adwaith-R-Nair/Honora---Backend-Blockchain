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

# 🚀 Setup Instructions (For Teammates)

## 1️⃣ Clone Repository

```bash
git clone https://github.com/Adwaith-R-Nair/Honora---Backend-Blockchain.git
cd Honora---Backend-Blockchain
```

---

## 2️⃣ Install Root Dependencies (Hardhat)

```bash
npm install
```

---

## 3️⃣ Install Backend Dependencies

```bash
cd backend
npm install
cd ..
```

---

## 4️⃣ Setup Environment Variables

Inside:

```
backend/.env
```

Add:

```
PINATA_JWT=your_pinata_jwt
CONTRACT_ADDRESS=contract_address_after_deployment
```

⚠️ Do NOT push `.env` to GitHub.

---

# 🧪 Running The Project Locally

You will need 3 terminals.

---

## Terminal 1 — Start Local Blockchain

```bash
npx hardhat node
```

---

## Terminal 2 — Deploy Smart Contract

```bash
npx hardhat run scripts/deploy.ts --network localhost
```

Copy the deployed contract address and paste it into:

```
backend/.env
```

Restart backend after updating.

---

## Terminal 3 — Start Backend

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

# 👨‍💻 Built By

Adwaith R Nair  
KTU BTech CSE  
Honora Project – Mini Project

---

# ⚠️ Important Notes

- Local blockchain resets when `hardhat node` restarts
- Contract must be redeployed after each restart
- Update `.env` accordingly

---

# 📌 Tech Stack

Solidity  
Hardhat v3  
Ethers v6  
Node.js  
Express  
IPFS (Pinata)

---

# 🔥 Status

Phase 1 – Fully Functional MVP