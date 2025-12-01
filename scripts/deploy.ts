import { ethers } from "hardhat";



async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer account:", deployer.address);

    // Deploy MockUSDC for local testing
    console.log("Deploying MockUSDC contract...");
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUSDCInstance = await MockUSDC.deploy();
    await mockUSDCInstance.waitForDeployment();
    console.log("MockUSDC deployed at:", mockUSDCInstance.target);

    console.log("Deploying PrivatelyCollection contract...");
    const PrivatelyCollection = await ethers.getContractFactory("PrivatelyCollection");
    const privatelyCollectionInstance = await PrivatelyCollection.deploy("PrivatelyCollection", "PRX");
    await privatelyCollectionInstance.waitForDeployment();
    console.log("PrivatelyCollection deployed at:", privatelyCollectionInstance.target);

    console.log("Deploying PrivatelyAuctionSystem contract...");
    const PrivatelyAuctionSystem = await ethers.getContractFactory("PrivatelyAuctionSystem");
    const auctionSystemContractInstance = await PrivatelyAuctionSystem.deploy(
        mockUSDCInstance.target,
        privatelyCollectionInstance.target,
        "PrivatelyAuctionSystem",
        "1.0.0"
    );
    await auctionSystemContractInstance.waitForDeployment();
    console.log("PrivatelyAuctionSystem deployed at:", auctionSystemContractInstance.target);

    console.log("\n=== Deployment Summary ===");
    console.log("MockUSDC:", mockUSDCInstance.target);
    console.log("PrivatelyCollection:", privatelyCollectionInstance.target);
    console.log("PrivatelyAuctionSystem:", auctionSystemContractInstance.target);
    console.log("========================\n");
}


main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
