import { expect } from "chai";
import { JsonRpcProvider, Wallet } from "ethers";
import { before, describe } from "mocha";
import { MintRequest, PrivatelyNFTClient, TransferRequest } from "../src";



const ARTIFACT: object = require(process.env.PRIVATELY_NFT_ARTIFACT_PATH as string);



const PROVIDER_URL = "http://127.0.0.1:8545/";
const RELAYER_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const USER1_PRIVATE_KEY = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
const USER2_PRIVATE_KEY = "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a";

const FIRST_TITLE = "Nap - La Kiffance";
const SECOND_TITLE = "SCH - Otto";
const THIRD_TITLE = "The Weeknd - Blinding Lights";
const FOURTH_TITLE = "Rosalia - La Fama";

describe("PrivatelyNFTClient - Comprehensive Tests", function () {
    let provider: JsonRpcProvider;

    let relayerWallet: Wallet;
    let user1Wallet: Wallet;
    let user2Wallet: Wallet;

    let relayerClient: PrivatelyNFTClient;
    let user1Client: PrivatelyNFTClient;
    let user2Client: PrivatelyNFTClient;


    before(async function () {
        provider = new JsonRpcProvider(PROVIDER_URL);

        relayerWallet = new Wallet(RELAYER_PRIVATE_KEY, provider);
        user1Wallet = new Wallet(USER1_PRIVATE_KEY, provider);
        user2Wallet = new Wallet(USER2_PRIVATE_KEY, provider);

        relayerClient = new PrivatelyNFTClient(relayerWallet, ARTIFACT);
        user1Client = new PrivatelyNFTClient(user1Wallet, ARTIFACT);
        user2Client = new PrivatelyNFTClient(user2Wallet, ARTIFACT);

        await relayerClient.init();
        await user1Client.init();
        await user2Client.init();
    });

    describe("Minting Functions", function () {
        let startNftCount: number;
        let mintRequest: MintRequest;
        let mintSignature: string;

        it("USER1 should create a mint request with valid request object and signature", async function () {
            this.timeout(10_000);

            startNftCount = (await user1Client.getNFTs()).length;

            ({request: mintRequest, signature: mintSignature} =
                await user1Client.createMintRequest(FIRST_TITLE, "url_" + FIRST_TITLE));

            expect(mintRequest).to.be.an("object");
            expect(mintSignature).to.be.a("string");
        });

        it("RELAYER should relay USER1 the mint request and mint an NFT", async function () {
            this.timeout(10_000);

            expect(mintRequest).to.exist;
            expect(mintSignature).to.exist;

            const tx = await relayerClient.relayMintRequest(mintRequest, mintSignature);
            await tx.wait(1);
            expect(tx).to.have.property("hash");
        });

        it("USER1 should have one more NFT after minting", async function () {
            this.timeout(10_000);

            const endNftCount = (await user1Client.getNFTs()).length;
            expect(endNftCount).to.equal(startNftCount + 1);
        });

        it("USER2 should create a mint request with valid request object and signature", async function () {
            this.timeout(10_000);

            startNftCount = (await user2Client.getNFTs()).length;

            ({request: mintRequest, signature: mintSignature} =
                await user2Client.createMintRequest(SECOND_TITLE, "url_" + SECOND_TITLE));

            expect(mintRequest).to.be.an("object");
            expect(mintSignature).to.be.a("string");
        });

        it("RELAYER should relay USER2 the mint request and mint an NFT", async function () {
            this.timeout(10_000);

            expect(mintRequest).to.exist;
            expect(mintSignature).to.exist;

            const tx = await relayerClient.relayMintRequest(mintRequest, mintSignature);
            await tx.wait(1);
            expect(tx).to.have.property("hash");
        });

        it("USER1 should have one more NFT after minting", async function () {
            this.timeout(10_000);

            const endNftCount = (await user2Client.getNFTs()).length;
            expect(endNftCount).to.equal(startNftCount + 1);
        });
    });


    describe("NFT Retrieval Functions", function () {
        it("should retrieve all NFTs from the contract", async function () {
            this.timeout(1_000);

            const allNFTs = await relayerClient.getAllNFTs();
            expect(allNFTs).to.be.an("array").that.is.not.empty;

            for (const nft of allNFTs) {
                const data = await relayerClient.getData(nft);
                expect(data).to.have.property("title");
                expect(data.title).to.be.a("string");
                expect(data.title).to.satisfy((title: string) => {
                    return title === FIRST_TITLE || title === SECOND_TITLE;
                });
            }
        });


        it("should retrieve all NFTs of USER1", async function () {
            this.timeout(1_000);

            const user1NFTs = await user1Client.getNFTs();
            expect(user1NFTs).to.be.an("array").that.is.not.empty;

            for (const nft of user1NFTs) {
                const data = await user1Client.getData(nft);
                expect(data).to.have.property("title");
                expect(data.title).to.be.a("string");
                expect(data.title).to.be.equal(FIRST_TITLE);
                expect(data.tokenURI).to.be.equal("url_" + FIRST_TITLE);
            }
        });


        it("should retrieve all NFTs of USER2", async function () {
            this.timeout(1_000);

            const user1NFTs = await user2Client.getNFTs();
            expect(user1NFTs).to.be.an("array").that.is.not.empty;

            for (const nft of user1NFTs) {
                const data = await user2Client.getData(nft);
                expect(data).to.have.property("title");
                expect(data.title).to.be.a("string");
                expect(data.title).to.be.equal(SECOND_TITLE);
                expect(data.tokenURI).to.be.equal("url_" + SECOND_TITLE);
            }
        });


        it("USER1 should retrieve all NFTs of USER2", async function () {
            this.timeout(1_000);

            const user2NFTs = await user1Client.getNFTsOfUser(user2Wallet.address);
            expect(user2NFTs).to.be.an("array").that.is.not.empty;

            for (const nft of user2NFTs) {
                const data = await user1Client.getData(nft);
                expect(data).to.have.property("title");
                expect(data.title).to.be.a("string");
                expect(data.title).to.be.equal(SECOND_TITLE);
                expect(data.tokenURI).to.be.equal("url_" + SECOND_TITLE);
            }
        });
    });

    describe("Transfer Functions", function () {
        let transferTokenId: bigint;
        let transferRequest: TransferRequest;
        let transferSignature: string;

        before(async function () {
            this.timeout(10_000);
            const {request, signature} = await user1Client.createMintRequest(
                THIRD_TITLE,
                "url_" + THIRD_TITLE
            );
            const tx = await relayerClient.relayMintRequest(request, signature);
            await tx.wait(1);

            const userNFTs = await user1Client.getNFTs();
            transferTokenId = userNFTs[userNFTs.length - 1];
        });


        it("USER1 should create a valid transfer request for USER2", async function () {
            this.timeout(1_000);

            ({request: transferRequest, signature: transferSignature} =
                await user1Client.createTransferRequest(user2Wallet.address, transferTokenId));

            expect(transferRequest).to.be.an("object");
            expect(transferSignature).to.be.a("string");
        });

        it("RELAYER should relay the transfer request and transfer the NFT", async function () {
            this.timeout(10_000);

            expect(transferRequest).to.exist;
            expect(transferSignature).to.exist;

            const tx = await relayerClient.relayTransferRequest(transferRequest, transferSignature);
            await tx.wait(1);
            expect(tx).to.have.property("hash");
        });

        it("USER2 should have the transferred NFT", async function () {
            this.timeout(1_000);

            const user2NFTs = await user2Client.getNFTs();
            expect(user2NFTs).to.include(transferTokenId);

            const data = await user2Client.getData(transferTokenId);
            expect(data).to.have.property("title");
            expect(data.title).to.be.a("string");
            expect(data.title).to.be.equal(THIRD_TITLE);
            expect(data.tokenURI).to.be.equal("url_" + THIRD_TITLE);
        });
    });

    describe("Ping pong transfer 5 times", function () {
        let transferTokenId: bigint;

        before(async function () {
            this.timeout(10_000);
            const {request, signature} = await user1Client.createMintRequest(
                FOURTH_TITLE,
                "url_" + FOURTH_TITLE
            );
            const tx = await relayerClient.relayMintRequest(request, signature);
            await tx.wait(1);

            const userNFTs = await user1Client.getNFTs();
            transferTokenId = userNFTs[userNFTs.length - 1];
        });


        async function transferNFT(from: PrivatelyNFTClient, to: PrivatelyNFTClient, tokenId: bigint) {
            const toAddress = await to.signer.getAddress();
            const {request, signature} = await from.createTransferRequest(toAddress, tokenId);
            expect(request).to.be.an("object");
            expect(signature).to.be.a("string");

            const tx = await relayerClient.relayTransferRequest(request, signature);
            expect(tx).to.have.property("hash");

            await tx.wait(1);
        }


        async function ensureNFTOwnership(client: PrivatelyNFTClient, tokenId: bigint, title: string) {
            const nfts = await client.getNFTs();
            expect(nfts).to.include(tokenId);

            const data = await client.getData(tokenId);
            expect(data).to.have.property("title");
            expect(data.title).to.be.a("string");
            expect(data.title).to.be.equal(title);
            expect(data.tokenURI).to.be.equal("url_" + title);
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
});
