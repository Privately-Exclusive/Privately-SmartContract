import { ethers } from "hardhat";

async function main() {
    const USDC_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const TEST_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

    console.log("🔍 Checking USDC contract at:", USDC_ADDRESS);

    // Try to get the contract
    const usdc = await ethers.getContractAt("MockUSDC", USDC_ADDRESS);

    try {
        // Check decimals
        const decimals = await usdc.decimals();
        console.log("✅ decimals():", decimals);
    } catch (error) {
        console.log("❌ decimals() failed:", error.message);
    }

    try {
        // Check balance
        const balance = await usdc.balanceOf(TEST_ADDRESS);
        console.log("✅ balanceOf():", ethers.formatUnits(balance, 6), "USDC");
    } catch (error) {
        console.log("❌ balanceOf() failed:", error.message);
    }

    try {
        // Check nonces (for permit)
        const nonce = await usdc.nonces(TEST_ADDRESS);
        console.log("✅ nonces():", nonce.toString());
    } catch (error) {
        console.log("❌ nonces() failed:", error.message);
        console.log("⚠️  This contract doesn't support EIP-2612 permit!");
    }

    try {
        // Check permit function exists
        const domain = await usdc.eip712Domain();
        console.log("✅ EIP-712 domain found - contract supports permit");
    } catch (error) {
        console.log("❌ No EIP-712 domain - contract doesn't support permit");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
