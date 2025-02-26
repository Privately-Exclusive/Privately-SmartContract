import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { JsonRpcProvider, Wallet } from "ethers";
import { before, describe } from "mocha";
import { PrivatelyClient } from "../src";
import { RequestType } from "../src/common/request-signature";



const PROVIDER_URL = "http://127.0.0.1:8545/";
const RELAYER_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const USER1_PRIVATE_KEY = "0xdf57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e";
const USER2_PRIVATE_KEY = "0xde9be858da4a475276426320d5e9262ecfc3ba460bfac56360bfa6c4c28b4ee0";
const USER3_PRIVATE_KEY = "0x689af8efa8c651a91ad287602527f3af2fe9f6501a7ac4b061667b5a93e037fd";

const FIRST_TITLE = "SCH - Deux Mille";


chai.use(chaiAsPromised);



export const auctionSystemTests = function () {

    let contractAddress: string;

    let relayerClient: PrivatelyClient;
    let user1Client: PrivatelyClient;
    let user2Client: PrivatelyClient;
    let user3Client: PrivatelyClient;

    let auctionId: bigint;
    let auctionEndTime: number;


    before(async function () {
        const provider = new JsonRpcProvider(PROVIDER_URL);

        const relayerWallet = new Wallet(RELAYER_PRIVATE_KEY, provider);
        const user1Wallet = new Wallet(USER1_PRIVATE_KEY, provider);
        const user2Wallet = new Wallet(USER2_PRIVATE_KEY, provider);
        const user3Wallet = new Wallet(USER3_PRIVATE_KEY, provider);

        relayerClient = await PrivatelyClient.create(relayerWallet);
        user1Client = await PrivatelyClient.create(user1Wallet);
        user2Client = await PrivatelyClient.create(user2Wallet);
        user3Client = await PrivatelyClient.create(user3Wallet);

        contractAddress = relayerClient.auctions.getContractAddress();
    });


    describe("Auction Creation", function () {
        let tokenId: bigint;


        it("USER1 should create a mint request and RELAYER should mint the tokens", async function () {
            this.timeout(15_000);

            const requestSignature = await user1Client.collection.createMintRequest(FIRST_TITLE, "url_" + FIRST_TITLE);
            const tx = await relayerClient.collection.relayMintRequest(requestSignature.request, requestSignature.signature);
            await tx.wait(1);

            const userCollection = await user1Client.collection.getCollection();
            expect(userCollection.length).to.equal(1);

            const item = userCollection[userCollection.length - 1];
            expect(item).to.haveOwnProperty("id");
            expect(item.title).to.equal(FIRST_TITLE);

            tokenId = item.id;
        });


        it("RELAYER should mint PrivatelyCoins for all users", async function () {
            this.timeout(30_000);

            const tx1 = await relayerClient.coin.mint(await user1Client.getAddress(), 100n);
            await tx1.wait();
            expect(await user1Client.coin.getBalance()).to.equal(100n);

            const tx2 = await relayerClient.coin.mint(await user2Client.getAddress(), 200n);
            await tx2.wait();
            expect(await user2Client.coin.getBalance()).to.equal(200n);

            const tx3 = await relayerClient.coin.mint(await user3Client.getAddress(), 700n);
            await tx3.wait();
            expect(await user3Client.coin.getBalance()).to.equal(700n);
        });


        it("USER1 should not create an auction for more than 7 days", async function () {
            this.timeout(15_000);

            const currentTime = await relayerClient.getLastBlockTimestamp();
            const auctionEndTime = currentTime + 60 * 60 * 24 * 8;
            const contractAddress = relayerClient.auctions.getContractAddress();

            const approveRequest = await user1Client.collection.createApproveRequest(contractAddress, tokenId);
            const createAuctionRequest = await user1Client.auctions.createAuctionRequest(tokenId, 10n, BigInt(auctionEndTime));
            expect(createAuctionRequest.type).to.equal(RequestType.AUCTION_CREATE);

            const approveTx = await relayerClient.collection.relayApproveRequest(approveRequest.request, approveRequest.signature);
            await approveTx.wait(1);

            await expect(relayerClient.auctions.relayCreateAuctionRequest(createAuctionRequest.request, createAuctionRequest.signature)).to.be.rejectedWith(/End time must be within 7 days/);
        });


        it("USER1 should create an auction", async function () {
            this.timeout(15_000);

            const currentTime = await relayerClient.getLastBlockTimestamp();
            auctionEndTime = currentTime + 90;

            const {request: approveRequest, signature: approveSignature} = await user1Client.collection.createApproveRequest(contractAddress, tokenId);
            const {request: auctionRequest, signature: auctionSignature} = await user1Client.auctions.createAuctionRequest(tokenId, 10n, BigInt(auctionEndTime));

            const approveTx = await relayerClient.collection.relayApproveRequest(approveRequest, approveSignature);
            await approveTx.wait(1);

            const auctionTx = await relayerClient.auctions.relayCreateAuctionRequest(auctionRequest, auctionSignature);
            await auctionTx.wait(1);

            const userAuctions = await user1Client.auctions.getAuctions();
            expect(userAuctions.length).to.equal(1);

            const auction = userAuctions[userAuctions.length - 1];
            expect(auction.id).to.exist;
            expect(auction.tokenId).to.equal(tokenId);
            expect(auction.startPrice).to.equal(10n);

            auctionId = auction.id;
        });


        it("USER1 should not be able to create an auction for the same token", async function () {
            this.timeout(15_000);

            const {request: approveRequest, signature: approveSignature} = await user1Client.collection.createApproveRequest(contractAddress, tokenId);
            expect(relayerClient.collection.relayApproveRequest(approveRequest, approveSignature)).to.be.rejectedWith(/Not the owner/);
        });

        it("USER3 should get the auction via getAllAuctions", async function () {
            this.timeout(15_000);

            const allAuctions = await user3Client.auctions.getAllAuctions();
            expect(allAuctions.length).to.equal(1);
        });

        it("USER3 should get the auction via getAllActiveAuctions", async function () {
            this.timeout(15_000);

            const allActiveAuctions = await user3Client.auctions.getAllActiveAuctions();
            expect(allActiveAuctions.length).to.equal(1);
        });
    });

    describe("Auction Bidding", function () {
        it("USER2 should not bid less than the start price", async function () {
            this.timeout(10_000);

            const {request: approveRequest, signature: approveSignature} = await user2Client.coin.createApproveRequest(contractAddress, 9n);
            const approveTx = await relayerClient.coin.relayApproveRequest(approveRequest, approveSignature);
            await approveTx.wait(1);

            const bidRequest = await user2Client.auctions.createBidRequest(auctionId, 9n);
            expect(bidRequest.type).to.equal(RequestType.AUCTION_BID);
            await expect(relayerClient.auctions.relayBidRequest(bidRequest.request, bidRequest.signature)).to.be.rejectedWith(/Bid below start price/);
        });

        it("USER2 should bid on the auction and RELAYER should relay the bid", async function () {
            this.timeout(15_000);

            const {request: approveRequest, signature: approveSignature} = await user2Client.coin.createApproveRequest(contractAddress, 50n);
            const approveTx = await relayerClient.coin.relayApproveRequest(approveRequest, approveSignature);
            await approveTx.wait(1);

            const {request: bidRequest, signature: bidSignature} = await user2Client.auctions.createBidRequest(auctionId, 50n);
            const bidTx = await relayerClient.auctions.relayBidRequest(bidRequest, bidSignature);
            await bidTx.wait(1);

            const updatedAuction = await user1Client.auctions.getAuction(auctionId);
            expect(updatedAuction.highestBid).to.equal(50n);
        });

        it("USER3 should not be able to bid on the auction because he has not approved the contract", async function () {
            this.timeout(5_000);

            const {request: bidRequest, signature: bidSignature} = await user3Client.auctions.createBidRequest(auctionId, 100n);
            await expect(relayerClient.auctions.relayBidRequest(bidRequest, bidSignature)).to.be.rejectedWith(/Insufficient token allowance/);
        });

        it("USER3 should not be able to bid less than the current highest bid", async function () {
            this.timeout(15_000);

            const {request: approveRequest, signature: approveSignature} = await user3Client.coin.createApproveRequest(contractAddress, 40n);
            const approveTx = await relayerClient.coin.relayApproveRequest(approveRequest, approveSignature);
            await approveTx.wait(1);

            const {request: bidRequest, signature: bidSignature} = await user3Client.auctions.createBidRequest(auctionId, 40n);
            await expect(relayerClient.auctions.relayBidRequest(bidRequest, bidSignature)).to.be.rejectedWith(/Bid not high enough/);
        });

        it("USER3 should be able to bid on the auction", async function () {
            this.timeout(15_000);

            const {request: approveRequest, signature: approveSignature} = await user3Client.coin.createApproveRequest(contractAddress, 100n);
            const approveTx = await relayerClient.coin.relayApproveRequest(approveRequest, approveSignature);
            await approveTx.wait(1);

            const {request: bidRequest, signature: bidSignature} = await user3Client.auctions.createBidRequest(auctionId, 100n);
            const bidTx = await relayerClient.auctions.relayBidRequest(bidRequest, bidSignature);
            await bidTx.wait(1);

            const updatedAuction = await user1Client.auctions.getAuction(auctionId);
            expect(updatedAuction.highestBid).to.equal(100n);
        });

        it("USER2 shoud rebid on the auction", async function () {
            this.timeout(15_000);

            const {request: approveRequest, signature: approveSignature} = await user2Client.coin.createApproveRequest(contractAddress, 150n);
            const approveTx = await relayerClient.coin.relayApproveRequest(approveRequest, approveSignature);
            await approveTx.wait(1);

            const {request: bidRequest, signature: bidSignature} = await user2Client.auctions.createBidRequest(auctionId, 150n);
            const bidTx = await relayerClient.auctions.relayBidRequest(bidRequest, bidSignature);
            await bidTx.wait(1);

            const updatedAuction = await user1Client.auctions.getAuction(auctionId);
            expect(updatedAuction.highestBid).to.equal(150n);
        });


        it("RELAYER should not settle the auction because the auction has not ended", async function () {
            this.timeout(5_000);

            await expect(relayerClient.auctions.finalizeAuction(auctionId)).to.be.rejectedWith(/Auction not ended yet/);
        });


        it("USER3 should not rebid on the auction because the auction has ended", async function () {
            this.timeout(90_000);

            while (await relayerClient.getLastBlockTimestamp() < auctionEndTime)
                await new Promise(resolve => setTimeout(resolve, 1000));

            const {request: bidRequest, signature: bidSignature} = await user3Client.auctions.createBidRequest(auctionId, 200n);
            await expect(relayerClient.auctions.relayBidRequest(bidRequest, bidSignature)).to.be.rejectedWith(/Auction ended/);
        });
    });


    describe("Auction Settlement", function () {
        it("RELAYER should settle the auction", async function () {
            this.timeout(15_000);

            const settleTx = await relayerClient.auctions.finalizeAuction(auctionId);
            await settleTx.wait(1);

            const updatedAuction = await user1Client.auctions.getAuction(auctionId);
            expect(updatedAuction.settled).to.be.true;
        });


        it("USER1 should not be able to settle the auction again", async function () {
            this.timeout(15_000);

            await expect(relayerClient.auctions.finalizeAuction(auctionId)).to.be.rejectedWith(/Auction already settled/);
        });


        it("USER1 shoud not have the token anymore", async function () {
            const userCollection = await user1Client.collection.getCollection();
            expect(userCollection.length).to.equal(0);
        });


        it("USER2 should have the token", async function () {
            const userCollection = await user2Client.collection.getCollection();
            expect(userCollection.length).to.equal(1);
        });


        it("USER2 shoud not be able to withdraw his bid", async function () {
            await expect(relayerClient.auctions.withdraw()).to.be.rejectedWith(/No funds to withdraw/);
        });


        it("USER3 should be able to withdraw his bid", async function () {
            this.timeout(15_000);

            const withdrawTx = await user3Client.auctions.withdraw();
            await withdrawTx.wait(1);

            const user3Balance = await user3Client.coin.getBalance();
            expect(user3Balance).to.equal(700n);
        });


        it("USER3 should not be able to re withdraw his bid", async function () {
            await expect(user3Client.auctions.withdraw()).to.be.rejectedWith(/No funds to withdraw/);
        });


        it("USER1 should be able to withdraw the highest bid", async function () {
            this.timeout(2_000);

            const user1Balance = await user1Client.coin.getBalance();
            expect(user1Balance).to.equal(250n);
        });


        it("USER2 should not be able to get the auction via getAllActiveAuctions because the auction has ended", async function () {
            this.timeout(15_000);

            const allActiveAuctions = await user2Client.auctions.getAllActiveAuctions();
            expect(allActiveAuctions.length).to.equal(0);
        });
    });
};
