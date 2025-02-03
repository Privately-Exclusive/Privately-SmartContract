import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contract with account:", deployer.address);

  const SimpleNFT = await ethers.getContractFactory("PrivatelyNFT");
  const contract = await SimpleNFT.deploy("PrivatelyNFT", "PNFT");

  console.log("Contract deployed to address:", contract.target);
}

main()
.then(() => process.exit(0))
.catch((error) => {
    console.error(error);
    process.exit(1);
});
