import { ethers } from "hardhat";

/**
 * Script to mint MockUSDC tokens to a specified address
 * Usage: npx hardhat run scripts/mint-usdc.ts --network localhost
 *
 * You can modify the RECIPIENT_ADDRESS and AMOUNT below
 */

async function main() {
    // USDC contract address from your deployment
    const USDC_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

    // Address to receive USDC (change this to your user's wallet address)
    const RECIPIENT_ADDRESS = process.env.RECIPIENT_ADDRESS || "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

    // Amount to mint (1000 USDC = 1000 * 10^6 because USDC has 6 decimals)
    const AMOUNT = ethers.parseUnits(process.env.AMOUNT || "1000", 6);

    console.log("🪙  Minting MockUSDC tokens...");
    console.log("Contract:", USDC_ADDRESS);
    console.log("Recipient:", RECIPIENT_ADDRESS);
    console.log("Amount:", ethers.formatUnits(AMOUNT, 6), "USDC");

    // Get the MockUSDC contract
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const usdc = MockUSDC.attach(USDC_ADDRESS);

    // Check balance before
    const balanceBefore = await usdc.balanceOf(RECIPIENT_ADDRESS);
    console.log("\n📊 Balance before:", ethers.formatUnits(balanceBefore, 6), "USDC");

    // Mint tokens
    const tx = await usdc.mint(RECIPIENT_ADDRESS, AMOUNT);
    console.log("\n⏳ Transaction sent:", tx.hash);
    await tx.wait();
    console.log("✅ Transaction confirmed!");

    // Check balance after
    const balanceAfter = await usdc.balanceOf(RECIPIENT_ADDRESS);
    console.log("\n📊 Balance after:", ethers.formatUnits(balanceAfter, 6), "USDC");
    console.log("✨ Successfully minted", ethers.formatUnits(AMOUNT, 6), "USDC!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
