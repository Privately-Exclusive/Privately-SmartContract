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


        it("should return empty array for a token never auctioned", async function () {
            const unknownTokenId = 9999n;
            const auctions = await user3Client.auctions.getAuctionsByToken(unknownTokenId);
            expect(auctions).to.be.an("array").that.has.lengthOf(0);
        });


        it("should return all auctions for a token that was auctioned", async function () {
            this.timeout(10_000);

            const auctions = await user3Client.auctions.getAuctionsByToken(tokenId);

            expect(auctions).to.be.an("array").that.is.not.empty;

            auctions.forEach(auc => {
                expect(auc).to.have.property("id").that.is.a("bigint");
                expect(auc).to.have.property("seller").that.is.a("string");
                expect(auc).to.have.property("startPrice").that.is.a("bigint");
                expect(auc).to.have.property("highestBid").that.is.a("bigint");
                expect(auc).to.have.property("highestBidder").that.is.a("string");
                expect(auc).to.have.property("endTime").that.is.a("bigint");
                expect(auc).to.have.property("settled").that.is.a("boolean");
            });
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

    describe("User Bid Tracking", function () {
        let trackingTokenId1: bigint;
        let trackingTokenId2: bigint;
        let trackingAuctionId1: bigint;
        let trackingAuctionId2: bigint;

        it("should prepare tokens and auctions for tracking tests", async function () {
            this.timeout(60_000);

            // Mint more tokens for users since they spent some in previous tests
            const tx1 = await relayerClient.coin.mint(await user2Client.getAddress(), 300n);
            await tx1.wait();
            const tx2 = await relayerClient.coin.mint(await user3Client.getAddress(), 300n);
            await tx2.wait();

            // Mint two tokens for USER1
            const mintReq1 = await user1Client.collection.createMintRequest("TRACKING_TOKEN_1", "url_tracking_1");
            const mintTx1 = await relayerClient.collection.relayMintRequest(mintReq1.request, mintReq1.signature);
            await mintTx1.wait(1);

            const mintReq2 = await user1Client.collection.createMintRequest("TRACKING_TOKEN_2", "url_tracking_2");
            const mintTx2 = await relayerClient.collection.relayMintRequest(mintReq2.request, mintReq2.signature);
            await mintTx2.wait(1);

            const collection = await user1Client.collection.getCollection();
            trackingTokenId1 = collection[collection.length - 2].id;
            trackingTokenId2 = collection[collection.length - 1].id;

            // Create two auctions
            const currentTime = await relayerClient.getLastBlockTimestamp();
            const endTime1 = currentTime + 120;
            const endTime2 = currentTime + 180;

            // First auction
            const approveReq1 = await user1Client.collection.createApproveRequest(contractAddress, trackingTokenId1);
            const approveTx1 = await relayerClient.collection.relayApproveRequest(approveReq1.request, approveReq1.signature);
            await approveTx1.wait(1);

            const createReq1 = await user1Client.auctions.createAuctionRequest(trackingTokenId1, 20n, BigInt(endTime1));
            const createTx1 = await relayerClient.auctions.relayCreateAuctionRequest(createReq1.request, createReq1.signature);
            await createTx1.wait(1);

            // Second auction
            const approveReq2 = await user1Client.collection.createApproveRequest(contractAddress, trackingTokenId2);
            const approveTx2 = await relayerClient.collection.relayApproveRequest(approveReq2.request, approveReq2.signature);
            await approveTx2.wait(1);

            const createReq2 = await user1Client.auctions.createAuctionRequest(trackingTokenId2, 30n, BigInt(endTime2));
            const createTx2 = await relayerClient.auctions.relayCreateAuctionRequest(createReq2.request, createReq2.signature);
            await createTx2.wait(1);

            // Get auction IDs
            const userAuctions = await user1Client.auctions.getAuctions();
            trackingAuctionId1 = userAuctions[userAuctions.length - 2].id;
            trackingAuctionId2 = userAuctions[userAuctions.length - 1].id;
        });

        it("USER2 should have one bid auction initially from previous tests", async function () {
            const bidAuctions = await user2Client.auctions.getBidAuctions();
            const activeBidAuctions = await user2Client.auctions.getActiveBidAuctions();

            expect(bidAuctions.length).to.equal(1); // From previous tests
            expect(activeBidAuctions.length).to.equal(0); // Previous auction ended
        });

        it("USER3 should have one bid auction initially from previous tests", async function () {
            const user3Address = await user3Client.getAddress();
            const bidAuctions = await user2Client.auctions.getUserBidAuctions(user3Address);
            const activeBidAuctions = await user2Client.auctions.getUserActiveBidAuctions(user3Address);

            expect(bidAuctions.length).to.equal(1); // From previous tests
            expect(activeBidAuctions.length).to.equal(0); // Previous auction ended
        });

        it("USER2 should bid on first tracking auction", async function () {
            this.timeout(15_000);

            const approveReq = await user2Client.coin.createApproveRequest(contractAddress, 25n);
            const approveTx = await relayerClient.coin.relayApproveRequest(approveReq.request, approveReq.signature);
            await approveTx.wait(1);

            const bidReq = await user2Client.auctions.createBidRequest(trackingAuctionId1, 25n);
            const bidTx = await relayerClient.auctions.relayBidRequest(bidReq.request, bidReq.signature);
            await bidTx.wait(1);

            const bidAuctions = await user2Client.auctions.getBidAuctions();
            const activeBidAuctions = await user2Client.auctions.getActiveBidAuctions();

            expect(bidAuctions.length).to.equal(2);
            expect(activeBidAuctions.length).to.equal(1);
            expect(activeBidAuctions[0].id).to.equal(trackingAuctionId1);
        });

        it("USER3 should bid on both tracking auctions", async function () {
            this.timeout(20_000);

            // Bid on first auction
            const approveReq1 = await user3Client.coin.createApproveRequest(contractAddress, 35n);
            const approveTx1 = await relayerClient.coin.relayApproveRequest(approveReq1.request, approveReq1.signature);
            await approveTx1.wait(1);

            const bidReq1 = await user3Client.auctions.createBidRequest(trackingAuctionId1, 35n);
            const bidTx1 = await relayerClient.auctions.relayBidRequest(bidReq1.request, bidReq1.signature);
            await bidTx1.wait(1);

            // Bid on second auction
            const approveReq2 = await user3Client.coin.createApproveRequest(contractAddress, 40n);
            const approveTx2 = await relayerClient.coin.relayApproveRequest(approveReq2.request, approveReq2.signature);
            await approveTx2.wait(1);

            const bidReq2 = await user3Client.auctions.createBidRequest(trackingAuctionId2, 40n);
            const bidTx2 = await relayerClient.auctions.relayBidRequest(bidReq2.request, bidReq2.signature);
            await bidTx2.wait(1);

            const bidAuctions = await user3Client.auctions.getBidAuctions();
            const activeBidAuctions = await user3Client.auctions.getActiveBidAuctions();

            expect(bidAuctions.length).to.equal(3); // Including previous tests
            expect(activeBidAuctions.length).to.equal(2);
        });

        it("USER2 should bid again on first auction (no duplicate tracking)", async function () {
            this.timeout(15_000);

            const approveReq = await user2Client.coin.createApproveRequest(contractAddress, 45n);
            const approveTx = await relayerClient.coin.relayApproveRequest(approveReq.request, approveReq.signature);
            await approveTx.wait(1);

            const bidReq = await user2Client.auctions.createBidRequest(trackingAuctionId1, 45n);
            const bidTx = await relayerClient.auctions.relayBidRequest(bidReq.request, bidReq.signature);
            await bidTx.wait(1);

            const bidAuctions = await user2Client.auctions.getBidAuctions();
            const activeBidAuctions = await user2Client.auctions.getActiveBidAuctions();

            // Should still be 2 auctions (no duplicate)
            expect(bidAuctions.length).to.equal(2);
            expect(activeBidAuctions.length).to.equal(1);
        });

        it("should test getUserBidAuctions and getUserActiveBidAuctions with specific addresses", async function () {
            const user2Address = await user2Client.getAddress();
            const user3Address = await user3Client.getAddress();

            const user2BidAuctions = await relayerClient.auctions.getUserBidAuctions(user2Address);
            const user2ActiveBidAuctions = await relayerClient.auctions.getUserActiveBidAuctions(user2Address);

            const user3BidAuctions = await relayerClient.auctions.getUserBidAuctions(user3Address);
            const user3ActiveBidAuctions = await relayerClient.auctions.getUserActiveBidAuctions(user3Address);

            expect(user2BidAuctions.length).to.equal(2);
            expect(user2ActiveBidAuctions.length).to.equal(1);

            expect(user3BidAuctions.length).to.equal(3);
            expect(user3ActiveBidAuctions.length).to.equal(2);

            // Verify auction IDs are included
            const user2ActiveIds = user2ActiveBidAuctions.map(a => a.id);
            const user3ActiveIds = user3ActiveBidAuctions.map(a => a.id);

            expect(user2ActiveIds).to.include(trackingAuctionId1);
            expect(user3ActiveIds).to.include(trackingAuctionId1);
            expect(user3ActiveIds).to.include(trackingAuctionId2);
        });
    });

    describe("Events", function () {

        const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

        let auctionEventId: bigint;
        let auctionEventEndTime: number;
        let eventTokenId: bigint;

        let user1Address: string;
        let user2Address: string;
        let user3Address: string;

        before(async function () {
            user1Address = await user1Client.getAddress();
            user2Address = await user2Client.getAddress();
            user3Address = await user3Client.getAddress();
        });

        it("should emit OnCreate event", async function () {
            this.timeout(30_000);

            const onCreate = new Promise<void>((resolve, reject) => {
                user1Client.auctions.onCreateEvent((auctionId, seller) => {
                    try {
                        auctionEventId = auctionId;
                        expect(seller).to.equal(user1Address);
                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                });
            });

            const mintReq = await user1Client.collection.createMintRequest("EVENT_TOKEN", "url_EVENT_TOKEN");
            const mintTx = await relayerClient.collection.relayMintRequest(mintReq.request, mintReq.signature);
            await mintTx.wait(1);

            const collection = await user1Client.collection.getCollection();
            eventTokenId = collection[collection.length - 1].id;

            const approveReq = await user1Client.collection.createApproveRequest(contractAddress, eventTokenId);
            const approveTx = await relayerClient.collection.relayApproveRequest(approveReq.request, approveReq.signature);
            await approveTx.wait(1);

            const currentTime = await relayerClient.getLastBlockTimestamp();
            auctionEventEndTime = currentTime + 25;

            const createReq = await user1Client.auctions.createAuctionRequest(eventTokenId, 10n, BigInt(auctionEventEndTime));
            const createTx = await relayerClient.auctions.relayCreateAuctionRequest(createReq.request, createReq.signature);
            await createTx.wait(1);

            await onCreate;
        });

        it("should emit OnBid event for USER3", async function () {
            this.timeout(20_000);

            const onBid = new Promise<void>((resolve, reject) => {
                user3Client.auctions.onBidEvent((auctionId, bidder, bidAmount) => {
                    try {
                        expect(auctionId).to.equal(auctionEventId);
                        expect(bidder).to.equal(user3Address);
                        expect(bidAmount).to.equal(50n);
                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                });
            });

            const approveReq = await user3Client.coin.createApproveRequest(contractAddress, 50n);
            const approveTx = await relayerClient.coin.relayApproveRequest(approveReq.request, approveReq.signature);
            await approveTx.wait(1);

            const bidReq = await user3Client.auctions.createBidRequest(auctionEventId, 50n);
            const bidTx = await relayerClient.auctions.relayBidRequest(bidReq.request, bidReq.signature);
            await bidTx.wait(1);

            await onBid;
        });

        it("should emit OnEnd event when auction is finalized", async function () {
            this.timeout(40_000);

            const onEnd = new Promise<void>((resolve, reject) => {
                relayerClient.auctions.onEndEvent((auctionId) => {
                    try {
                        expect(auctionId).to.equal(auctionEventId);
                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                });
            });

            const now = await relayerClient.getLastBlockTimestamp();
            const waitSec = auctionEventEndTime - now + 2;
            if (waitSec > 0) {
                await sleep(waitSec * 1_000);
            }

            const endTx = await relayerClient.auctions.finalizeAuction(auctionEventId);
            await endTx.wait(1);

            await onEnd;
        });

        it("should emit OnWithdraw event when USER2 withdraws", async function () {
            this.timeout(20_000);

            const onWithdraw = new Promise<void>((resolve, reject) => {
                relayerClient.auctions.onWithdrawEvent((user, amount) => {
                    try {
                        expect(user).to.equal(user2Address);
                        expect(amount).to.equal(75n);
                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                });
            });

            const withdrawTx = await user2Client.auctions.withdraw();
            await withdrawTx.wait(1);

            await onWithdraw;
        });
    });

};
