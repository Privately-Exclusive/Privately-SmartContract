import { PrivatelyClient } from "privately-smartcontract-lib";
import { ethers, Wallet, JsonRpcProvider } from "ethers";

// Test private keys from lib/test/auctions.test.ts
const PROVIDER_URL = "http://127.0.0.1:8545/";
const RELAYER_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const USER1_PRIVATE_KEY = "0xdf57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e";

const nftsToCreate = [
    {
        url: "https://images.pexels.com/photos/574519/pexels-photo-574519.jpeg",
        name: "BMW",
        description: "A stunning red BMW captured in motion, embodying speed and elegance.",
        price: '1',
        type: 'image',
        endDate: ''
    },
    {
        url: "https://images.pexels.com/photos/14659337/pexels-photo-14659337.jpeg",
        name: "Look",
        description: "A contemplative glance frozen in time — a portrait full of emotion and mystery.",
        price: '1',
        type: 'image',
        endDate: ''
    },
    {
        url: "https://images.pexels.com/photos/32958964/pexels-photo-32958964.jpeg",
        name: "Moon",
        description: "A surreal composition of the moon resting inside a factory setting — industrial meets celestial.",
        price: '1',
        type: 'image',
        endDate: ''
    },
    {
        url: "https://images.pexels.com/photos/31558940/pexels-photo-31558940.jpeg",
        name: "Dance with Sea",
        description: "A graceful figure dancing beside the waves — a tribute to nature and human movement.",
        price: '1',
        type: 'image',
        endDate: ''
    },
    {
        url: "https://images.pexels.com/photos/705423/pexels-photo-705423.jpeg",
        name: "Real Barcelona",
        description: "A raw and atmospheric capture of Barcelona’s everyday beauty, where architecture and soul meet.",
        price: '1',
        type: 'image',
        endDate: ''
    },
    {
        url: "https://images.pexels.com/photos/1423580/pexels-photo-1423580.jpeg",
        name: "Great Wall of China",
        description: "A breathtaking view of the Great Wall of China stretching through mountainous terrain — history carved in stone.",
        price: '1',
        type: 'image',
        endDate: ''
    },
    {
        url: "https://images.pexels.com/photos/12985830/pexels-photo-12985830.jpeg",
        name: "Simple Device",
        description: "Minimalist tech aesthetics: a clean and modern device placed in a soft, ambient setting.",
        price: '1',
        type: 'image',
        endDate: ''
    },
];


async function main() {
    console.log("Connecting to provider...");
    const provider = new JsonRpcProvider(PROVIDER_URL);

    // Initialize wallets and clients
    const relayerWallet = new Wallet(RELAYER_PRIVATE_KEY, provider);
    const user1Wallet = new Wallet(USER1_PRIVATE_KEY, provider);

    console.log("Creating clients...");
    const relayerClient = await PrivatelyClient.create(relayerWallet);
    const user1Client = await PrivatelyClient.create(user1Wallet);

    console.log("Clients created:");
    console.log("- Relayer:", await relayerClient.getAddress());
    console.log("- User 1 (NFT creator):", await user1Client.getAddress());

    console.log(`\n--- Starting to create ${nftsToCreate.length} NFTs and auctions ---`);

    for (const nftData of nftsToCreate) {
        try {
            console.log(`\nProcessing "${nftData.name}"...`);

            // 1. User 1 creates an NFT
            const { request: mintRequest, signature: mintSignature } = await user1Client.collection.createMintRequest(nftData.name, JSON.stringify(nftData));
            const mintTx = await relayerClient.collection.relayMintRequest(mintRequest, mintSignature);
            await mintTx.wait();

            const user1Collection = await user1Client.collection.getCollection();
            const newNft = user1Collection.find(nft => nft.title === nftData.name);

            if (!newNft) {
                console.error(`Error: Minted NFT "${nftData.name}" not found.`);
                continue; // Skip to the next NFT
            }
            const tokenId = newNft.id;
            console.log(`- NFT created with ID: ${tokenId}`);

            // 2. User 1 creates an auction for the new NFT
            const auctionContractAddress = relayerClient.auctions.getContractAddress();
            const currentTime = await relayerClient.getLastBlockTimestamp();
            const auctionEndTime = currentTime + (60 * 60 * 24 * 5); // 100 days

            // Approve the auction contract to take the NFT
            const { request: approveNftRequest, signature: approveNftSignature } = await user1Client.collection.createApproveRequest(auctionContractAddress, tokenId);
            const approveNftTx = await relayerClient.collection.relayApproveRequest(approveNftRequest, approveNftSignature);
            await approveNftTx.wait();

            // Create the auction
            const { request: createAuctionRequest, signature: createAuctionSignature } = await user1Client.auctions.createAuctionRequest(tokenId, BigInt(nftData.price), BigInt(auctionEndTime));
            const createAuctionTx = await relayerClient.auctions.relayCreateAuctionRequest(createAuctionRequest, createAuctionSignature);
            await createAuctionTx.wait();

            const userAuctions = await user1Client.auctions.getAuctions();
            const newAuction = userAuctions.find(auction => auction.tokenId === tokenId);

            if (!newAuction) {
                console.error(`- Error: Auction for NFT "${nftData.name}" not found.`);
                continue;
            }
            console.log(`- Auction created with ID: ${newAuction.id} (duration: 100 days)`);

        } catch (error) {
            console.error(`Failed to process "${nftData.name}". Error:`, error);
        }
    }

    console.log("\n--- Mock data population complete! ---");
}

main().catch((error) => {
    console.error("An unexpected error occurred:", error);
    process.exit(1);
});