import mongoose, { Schema, Document } from "mongoose";

// ── Interface ─────────────────────────────────────────────────────────────────
export interface IEvidence extends Document {
  evidenceId: number;
  caseId: number;
  caseName: string;
  department: string;
  filename: string;
  ipfsCID: string;
  ipfsUrl: string;
  fileHash: string;
  uploadedBy: string;
  timestamp: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISupportingDoc extends Document {
  docId: number;
  evidenceId: number;
  docType: string;
  filename: string;
  ipfsCID: string;
  ipfsUrl: string;
  fileHash: string;
  uploadedBy: string;
  timestamp: number;
  createdAt: Date;
  updatedAt: Date;
}

// ── Evidence Schema ───────────────────────────────────────────────────────────
const EvidenceSchema = new Schema<IEvidence>(
  {
    evidenceId:  { type: Number, required: true, unique: true },
    caseId:      { type: Number, required: true },
    caseName:    { type: String, required: true, trim: true },
    department:  { type: String, required: true, trim: true },
    filename:    { type: String, required: true },
    ipfsCID:     { type: String, required: true },
    ipfsUrl:     { type: String, required: true },
    fileHash:    { type: String, required: true, unique: true },
    uploadedBy:  { type: String, required: true, lowercase: true },
    timestamp:   { type: Number, required: true },
    status:      { type: String, enum: ["Open", "Under Investigation", "Closed"], default: "Under Investigation" },
  },
  { timestamps: true }
);

// ── Supporting Doc Schema ─────────────────────────────────────────────────────
const SupportingDocSchema = new Schema<ISupportingDoc>(
  {
    docId:      { type: Number, required: true, unique: true },
    evidenceId: { type: Number, required: true },
    docType:    { type: String, required: true },
    filename:   { type: String, required: true },
    ipfsCID:    { type: String, required: true },
    ipfsUrl:    { type: String, required: true },
    fileHash:   { type: String, required: true, unique: true },
    uploadedBy: { type: String, required: true, lowercase: true },
    timestamp:  { type: Number, required: true },
  },
  { timestamps: true }
);

// ── Models ────────────────────────────────────────────────────────────────────
export const Evidence = mongoose.model<IEvidence>("Evidence", EvidenceSchema);
export const SupportingDoc = mongoose.model<ISupportingDoc>("SupportingDoc", SupportingDocSchema);