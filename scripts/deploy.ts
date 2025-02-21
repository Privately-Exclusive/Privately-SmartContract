import { ethers } from "hardhat";



async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer account:", deployer.address);

    console.log("Deploying PrivatelyCoin contract...");
    const PrivatelyCoin = await ethers.getContractFactory("PrivatelyCoin");
    const privatelyCoinInstance = await PrivatelyCoin.deploy("PrivatelyCoin", "PRC");
    await privatelyCoinInstance.waitForDeployment();

    console.log("Deploying PrivatelyCollection contract...");
    const PrivatelyCollection = await ethers.getContractFactory("PrivatelyCollection");
    const privatelyCollectionInstance = await PrivatelyCollection.deploy("PrivatelyCollection", "PRX");
    await privatelyCollectionInstance.waitForDeployment();

    console.log("Deploying PrivatelyAuctionSystem contract...");
    const PrivatelyAuctionSystem = await ethers.getContractFactory("PrivatelyAuctionSystem");
    const auctionSystemContractInstance = await PrivatelyAuctionSystem.deploy(
        privatelyCoinInstance.target,
        privatelyCollectionInstance.target,
        "PrivatelyAuctionSystem",
        "1.0.0"
    );
    await auctionSystemContractInstance.waitForDeployment();

    console.log("Deploying done!");
}


main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
