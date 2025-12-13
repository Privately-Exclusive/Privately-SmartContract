import { ethers } from "hardhat";

// USDC addresses
const USDC_BASE_SEPOLIA = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const USDC_BASE_MAINNET = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";



async function main() {
    const [deployer] = await ethers.getSigners();
    const network = await ethers.provider.getNetwork();

    console.log("Deployer account:", deployer.address);
    console.log("Network:", network.name, "(chainId:", network.chainId, ")");

    // Determine USDC address based on network
    let usdcAddress: string;
    if (network.chainId === 84532n) {
        // Base Sepolia
        usdcAddress = USDC_BASE_SEPOLIA;
        console.log("Using USDC on Base Sepolia:", usdcAddress);
    } else if (network.chainId === 8453n) {
        // Base Mainnet
        usdcAddress = USDC_BASE_MAINNET;
        console.log("Using USDC on Base Mainnet:", usdcAddress);
    } else {
        throw new Error(`Unsupported network: ${network.name} (chainId: ${network.chainId}). Use deploy.ts for local deployment.`);
    }

    // Verify USDC contract exists
    const usdcCode = await ethers.provider.getCode(usdcAddress);
    if (usdcCode === "0x") {
        throw new Error(`USDC contract not found at ${usdcAddress}. Make sure you're on the correct network.`);
    }
    console.log("USDC contract verified at:", usdcAddress);

    console.log("\nDeploying PrivatelyCollection contract...");
    const PrivatelyCollection = await ethers.getContractFactory("PrivatelyCollection");
    const privatelyCollectionInstance = await PrivatelyCollection.deploy("PrivatelyCollection", "PRX");
    await privatelyCollectionInstance.waitForDeployment();
    console.log("PrivatelyCollection deployed at:", privatelyCollectionInstance.target);

    console.log("\nDeploying PrivatelyAuctionSystem contract...");
    const PrivatelyAuctionSystem = await ethers.getContractFactory("PrivatelyAuctionSystem");
    const auctionSystemContractInstance = await PrivatelyAuctionSystem.deploy(
        usdcAddress,
        privatelyCollectionInstance.target,
        "PrivatelyAuctionSystem",
        "1.0.0"
    );
    await auctionSystemContractInstance.waitForDeployment();
    console.log("PrivatelyAuctionSystem deployed at:", auctionSystemContractInstance.target);

    console.log("\n=== Deployment Summary ===");
    console.log("Network:", network.name);
    console.log("USDC:", usdcAddress);
    console.log("PrivatelyCollection:", privatelyCollectionInstance.target);
    console.log("PrivatelyAuctionSystem:", auctionSystemContractInstance.target);
    console.log("========================\n");

    console.log("Next steps:");
    console.log("1. Get USDC from Circle faucet: https://faucet.circle.com/");
    console.log("2. Approve USDC for the auction contract");
    console.log("3. Create an auction and start bidding!");
}


main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
