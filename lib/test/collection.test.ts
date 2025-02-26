import { expect } from "chai";
import { JsonRpcProvider, Wallet } from "ethers";
import { before, describe, it } from "mocha";
import { CollectionMintRequest, CollectionTransferRequest, PrivatelyClient } from "../src";
import { CollectionApproveRequest } from "../src/modules/collection/collection.approve.request";



const PROVIDER_URL = "http://127.0.0.1:8545/";
const RELAYER_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const USER1_PRIVATE_KEY = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
const USER2_PRIVATE_KEY = "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a";

const FIRST_TITLE = "Nap - La Kiffance";
const SECOND_TITLE = "SCH - Otto";
const THIRD_TITLE = "The Weeknd - Blinding Lights";
const FOURTH_TITLE = "Rosalia - La Fama";


export const collectionTests = function () {

    let relayerClient: PrivatelyClient;
    let user1Client: PrivatelyClient;
    let user2Client: PrivatelyClient;


    before(async function () {
        const provider = new JsonRpcProvider(PROVIDER_URL);

        const relayerWallet = new Wallet(RELAYER_PRIVATE_KEY, provider);
        const user1Wallet = new Wallet(USER1_PRIVATE_KEY, provider);
        const user2Wallet = new Wallet(USER2_PRIVATE_KEY, provider);

        relayerClient = await PrivatelyClient.Create(relayerWallet);
        user1Client = await PrivatelyClient.Create(user1Wallet);
        user2Client = await PrivatelyClient.Create(user2Wallet);
    });

    describe("Minting Functions", function () {
        let startNftCount: number;
        let mintRequest: CollectionMintRequest;
        let mintSignature: string;

        it("USER1 should create a mint request with valid request object and signature", async function () {
            this.timeout(10_000);

            startNftCount = (await user1Client.collection.getCollection()).length;

            ({request: mintRequest, signature: mintSignature} =
                await user1Client.collection.createMintRequest(FIRST_TITLE, "url_" + FIRST_TITLE));

            expect(mintRequest).to.be.an("object");
            expect(mintSignature).to.be.a("string");
        });

        it("RELAYER should relay USER1 the mint request and mint an NFT", async function () {
            this.timeout(10_000);

            expect(mintRequest).to.exist;
            expect(mintSignature).to.exist;

            const tx = await relayerClient.collection.relayMintRequest(mintRequest, mintSignature);
            expect(tx).to.be.an("object");
            expect(tx).to.have.property("hash");
            await tx.wait(1);
        });

        it("USER1 should have one more NFT after minting", async function () {
            this.timeout(10_000);

            const endNftCount = (await user1Client.collection.getCollection()).length;
            expect(endNftCount).to.equal(startNftCount + 1);
        });

        it("USER2 should create a mint request with valid request object and signature", async function () {
            this.timeout(10_000);

            startNftCount = (await user2Client.collection.getCollection()).length;

            ({request: mintRequest, signature: mintSignature} =
                await user2Client.collection.createMintRequest(SECOND_TITLE, "url_" + SECOND_TITLE));

            expect(mintRequest).to.be.an("object");
            expect(mintSignature).to.be.a("string");
        });

        it("RELAYER should relay USER2 the mint request and mint an NFT", async function () {
            this.timeout(10_000);

            expect(mintRequest).to.exist;
            expect(mintSignature).to.exist;

            const tx = await relayerClient.collection.relayMintRequest(mintRequest, mintSignature);
            await tx.wait(1);
            expect(tx).to.have.property("hash");
        });

        it("USER1 should have one more NFT after minting", async function () {
            this.timeout(10_000);

            const endNftCount = (await user2Client.collection.getCollection()).length;
            expect(endNftCount).to.equal(startNftCount + 1);
        });
    });


    describe("NFT Retrieval Functions", function () {
        it("should retrieve all Collection from the contract", async function () {
            this.timeout(1_000);

            const allCollection = await relayerClient.collection.getSupplyCollection();
            expect(allCollection).to.be.an("array").that.is.not.empty;

            for (const nft of allCollection) {
                const data = await relayerClient.collection.getData(nft);
                expect(data).to.have.property("title");
                expect(data.title).to.be.a("string");
                expect(data.title).to.satisfy((title: string) => {
                    return title === FIRST_TITLE || title === SECOND_TITLE;
                });
            }
        });


        it("should retrieve all Collection of USER1", async function () {
            this.timeout(1_000);

            const user1Collection = await user1Client.collection.getCollection();
            expect(user1Collection).to.be.an("array").that.is.not.empty;

            for (const nft of user1Collection) {
                const data = await user1Client.collection.getData(nft.id);
                expect(data).to.have.property("title");
                expect(data.title).to.be.a("string");
                expect(data.title).to.be.equal(FIRST_TITLE);
                expect(data.url).to.be.equal("url_" + FIRST_TITLE);
            }
        });


        it("should retrieve all Collection of USER2", async function () {
            this.timeout(1_000);

            const user1Collection = await user2Client.collection.getCollection();
            expect(user1Collection).to.be.an("array").that.is.not.empty;

            for (const nft of user1Collection) {
                expect(nft).to.have.property("title");
                expect(nft.title).to.be.a("string");
                expect(nft.title).to.be.equal(SECOND_TITLE);
                expect(nft.url).to.be.equal("url_" + SECOND_TITLE);
            }
        });


        it("USER1 should retrieve all Collection of USER2", async function () {
            this.timeout(1_000);

            const user2Address = await user2Client.getAddress();
            const user2Collection = await user1Client.collection.getUserCollection(user2Address);
            expect(user2Collection).to.be.an("array").that.is.not.empty;

            for (const nft of user2Collection) {
                const data = await user1Client.collection.getData(nft.id);
                expect(data).to.have.property("title");
                expect(data.title).to.be.a("string");
                expect(data.title).to.be.equal(SECOND_TITLE);
                expect(data.url).to.be.equal("url_" + SECOND_TITLE);
            }
        });
    });

    describe("Transfer Functions", function () {
        let transferTokenId: bigint;
        let transferRequest: CollectionTransferRequest;
        let transferSignature: string;

        before(async function () {
            this.timeout(10_000);
            const {request, signature} = await user1Client.collection.createMintRequest(
                THIRD_TITLE,
                "url_" + THIRD_TITLE
            );
            const tx = await relayerClient.collection.relayMintRequest(request, signature);
            await tx.wait(1);

            const userCollection = await user1Client.collection.getCollection();
            transferTokenId = userCollection[userCollection.length - 1].id;
        });


        it("USER1 should create a valid transfer request for USER2", async function () {
            this.timeout(1_000);

            const user2Address = await user2Client.signer.getAddress();
            ({request: transferRequest, signature: transferSignature} =
                await user1Client.collection.createTransferRequest(user2Address, transferTokenId));

            expect(transferRequest).to.be.an("object");
            expect(transferSignature).to.be.a("string");
        });

        it("RELAYER should relay the transfer request and transfer the NFT", async function () {
            this.timeout(10_000);

            expect(transferRequest).to.exist;
            expect(transferSignature).to.exist;

            const tx = await relayerClient.collection.relayTransferRequest(transferRequest, transferSignature);
            await tx.wait(1);
            expect(tx).to.have.property("hash");
        });

        it("USER2 should have the transferred NFT", async function () {
            this.timeout(1_000);

            const user2Collection = await user2Client.collection.getCollection();
            expect(user2Collection.map(x => x.id)).to.include(transferTokenId);

            const data = await user2Client.collection.getData(transferTokenId);
            expect(data).to.have.property("title");
            expect(data.title).to.be.a("string");
            expect(data.title).to.be.equal(THIRD_TITLE);
            expect(data.url).to.be.equal("url_" + THIRD_TITLE);
        });
    });

    describe("Meta Approval Functions", function () {
        let approvalTokenId: bigint;
        let approvalRequest: CollectionApproveRequest;
        let approvalSignature: string;

        before(async function () {
            this.timeout(10_000);
            const {request, signature} = await user1Client.collection.createMintRequest(
                "Meta Approval NFT",
                "url_MetaApprovalNFT"
            );
            const tx = await relayerClient.collection.relayMintRequest(request, signature);
            await tx.wait(1);
            const userCollection = await user1Client.collection.getCollection();
            approvalTokenId = userCollection[userCollection.length - 1].id;
        });

        it("USER1 should create a valid approve request for USER2", async function () {
            this.timeout(1_000);
            const user2Address = await user2Client.signer.getAddress();
            ({request: approvalRequest, signature: approvalSignature} =
                await user1Client.collection.createApproveRequest(user2Address, approvalTokenId));
            expect(approvalRequest).to.be.an("object");
            expect(approvalSignature).to.be.a("string");
        });

        it("RELAYER should relay the approve request and set approval", async function () {
            this.timeout(10_000);
            expect(approvalRequest).to.exist;
            expect(approvalSignature).to.exist;
            const tx = await relayerClient.collection.relayApproveRequest(approvalRequest, approvalSignature);
            await tx.wait(1);
            expect(tx).to.have.property("hash");
        });
    });

    describe("Ping pong transfer 5 times", function () {
        let transferTokenId: bigint;

        before(async function () {
            this.timeout(10_000);
            const {request, signature} = await user1Client.collection.createMintRequest(
                FOURTH_TITLE,
                "url_" + FOURTH_TITLE
            );
            const tx = await relayerClient.collection.relayMintRequest(request, signature);
            await tx.wait(1);

            const userCollection = await user1Client.collection.getCollection();
            transferTokenId = userCollection[userCollection.length - 1].id;
        });


        async function transferNFT(from: PrivatelyClient, to: PrivatelyClient, tokenId: bigint): Promise<void> {
            const toAddress = await to.signer.getAddress();
            const {request, signature} = await from.collection.createTransferRequest(toAddress, tokenId);
            expect(request).to.be.an("object");
            expect(signature).to.be.a("string");

            const tx = await relayerClient.collection.relayTransferRequest(request, signature);
            expect(tx).to.have.property("hash");

            await tx.wait(1);
        }


        async function ensureNFTOwnership(client: PrivatelyClient, tokenId: bigint, title: string) {
            const collection = await client.collection.getCollection();
            expect(collection.map(x => x.id)).to.include(tokenId);

            const data = await client.collection.getData(tokenId);
            expect(data).to.have.property("title");
            expect(data.title).to.be.a("string");
            expect(data.title).to.be.equal(title);
            expect(data.url).to.be.equal("url_" + title);
        }


        Array.from({length: 5}).forEach((_, i) => {
            it(`Transfer [${i + 1}/5]: USER1 -> USER2 & USER2 -> USER1`, async function () {
                this.timeout(30_000);
                await transferNFT(user1Client, user2Client, transferTokenId);
                await ensureNFTOwnership(user2Client, transferTokenId, FOURTH_TITLE);

                await transferNFT(user2Client, user1Client, transferTokenId);
                await ensureNFTOwnership(user1Client, transferTokenId, FOURTH_TITLE);
            });
        });
    });
};
