import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

// ── Role type mirroring Solidity enum ────────────────────────────────────────
export type UserRole = "Police" | "Forensic" | "Lawyer" | "Judge";

// ── Interface ─────────────────────────────────────────────────────────────────
export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  walletAddress: string;
  createdAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

// ── Schema ────────────────────────────────────────────────────────────────────
const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: [true, "Password is required"],
    },
    role: {
      type: String,
      enum: ["Police", "Forensic", "Lawyer", "Judge"],
      required: [true, "Role is required"],
    },
    walletAddress: {
      type: String,
      required: [true, "Wallet address is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// ── Method: compare plain password against stored hash ────────────────────────
UserSchema.methods.comparePassword = async function (
  password: string
): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash);
};

export const User = mongoose.model<IUser>("User", UserSchema);