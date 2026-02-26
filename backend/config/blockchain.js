import { ethers } from "ethers";
import fs from "fs";
import path from "path";

const abiPath = path.resolve("./config/abi.json");
const abi = JSON.parse(fs.readFileSync(abiPath, "utf8"));

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

export async function getContract() {
  const signer = await provider.getSigner();

  return new ethers.Contract(
    process.env.CONTRACT_ADDRESS,
    abi,
    signer
  );
}