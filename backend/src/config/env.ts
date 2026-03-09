import dotenv from "dotenv";
dotenv.config();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const ENV = {
  PINATA_JWT: requireEnv("PINATA_JWT"),
  RPC_URL: requireEnv("RPC_URL"),
  CONTRACT_ADDRESS: requireEnv("CONTRACT_ADDRESS"),
  PRIVATE_KEY: requireEnv("PRIVATE_KEY"),
  PORT: parseInt(process.env["PORT"] ?? "3000", 10),
};