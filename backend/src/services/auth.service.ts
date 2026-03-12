import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { User, type UserRole } from "../models/user.model.js";
import { ENV } from "../config/env.js";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  walletAddress: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  walletAddress: string;
}

// ── Register ──────────────────────────────────────────────────────────────────
export async function registerUser(payload: RegisterPayload) {
  const { name, email, password, role, walletAddress } = payload;

  // Check if email already exists
  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    throw new Error("Email already registered");
  }

  // Check if wallet address already exists
  const existingWallet = await User.findOne({
    walletAddress: walletAddress.toLowerCase(),
  });
  if (existingWallet) {
    throw new Error("Wallet address already registered");
  }

  // Hash password
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  // Create user
  const user = await User.create({
    name,
    email,
    passwordHash,
    role,
    walletAddress: walletAddress.toLowerCase(),
  });

  // Generate JWT
  const token = generateToken({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    walletAddress: user.walletAddress,
  });

  return {
    token,
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      walletAddress: user.walletAddress,
    },
  };
}

// ── Login ─────────────────────────────────────────────────────────────────────
export async function loginUser(payload: LoginPayload) {
  const { email, password } = payload;

  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("Invalid email or password");
  }

  // Compare password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  // Generate JWT
  const token = generateToken({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    walletAddress: user.walletAddress,
  });

  return {
    token,
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      walletAddress: user.walletAddress,
    },
  };
}

// ── JWT Helper ────────────────────────────────────────────────────────────────
function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, ENV.JWT_SECRET, {
    expiresIn: ENV.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}