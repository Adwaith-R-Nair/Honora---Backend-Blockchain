import { defineConfig } from "hardhat/config";
import hardhatEthers from "@nomicfoundation/hardhat-ethers";

export default defineConfig({
  plugins: [hardhatEthers],
  solidity: "0.8.24",
  networks: {
    localhost: {
      type: "http",
      url: "http://127.0.0.1:8545",
    },
    sepolia: {
      type: "http",
      url: "https://eth-sepolia.g.alchemy.com/v2/LH0gLLTo5hzFXYcyaUh9b",
      accounts: ["0xf0181804a7e4f704a28db90c848c9b6960c14487f83594a31f48c55474c28ea1"],
    },
  },
});