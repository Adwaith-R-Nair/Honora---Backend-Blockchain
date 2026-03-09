import { network } from "hardhat";

const connected = await network.connect();
console.log("Keys from network.connect():", Object.keys(connected));
console.log("Full object:", connected);