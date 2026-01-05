import { ethers } from "hardhat";

/**
 * Script to check USDC balance of an address
 * Usage: ADDRESS=0x... npx hardhat run scripts/check-usdc-balance.ts --network localhost
 */

async function main() {
    const USDC_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const ADDRESS_TO_CHECK = process.env.ADDRESS || "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

    console.log("🔍 Checking USDC balance...");
    console.log("Contract:", USDC_ADDRESS);
    console.log("Address:", ADDRESS_TO_CHECK);

    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const usdc = MockUSDC.attach(USDC_ADDRESS);

    const balance = await usdc.balanceOf(ADDRESS_TO_CHECK);
    console.log("\n💰 Balance:", ethers.formatUnits(balance, 6), "USDC");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
