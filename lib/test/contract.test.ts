/**
 * This test suite demonstrates interaction with the PrivatelyNFT smart contract
 * through gasless minting and transferring. It covers:
 *  - Mint Flow (User1 mints an NFT via the Relayer)
 *  - Transfer Flow (User1 transfers the NFT to User2 via the Relayer)
 *  - A "Ping Pong" flow, where User1 and User2 repeatedly transfer the same NFT
 *    back and forth, also via the Relayer.
 *
 * This version refactors some repetitive code by adding helper functions:
 *  - `getBalances()` to retrieve balances of User1, User2, and Relayer at once
 *  - `expectGasIsPaidByRelayer()` to check that User1 and User2 did not pay gas,
 *    and only Relayer's balance decreased.
 *  - `relayAndCheckGas()` to streamline the process of sending a transaction
 *    from the Relayer with an updated nonce and verifying balances.
 */

import {JsonRpcProvider, Wallet, Contract} from "ethers";
import {expect} from "chai";
import {PrivatelyNFTClient} from "../src";
import ARTIFACT from "../../artifacts/contracts/PrivatelyToken.sol/PrivatelyNFT.json";

const PROVIDER_URL = "http://127.0.0.1:8545/";
const USER1_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const USER2_PRIVATE_KEY = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
const RELAYER_PRIVATE_KEY = "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a";
const CONTRACT_ADDRESS = "0x5fbdb2315678afecb367f032d93f642f64180aa3";

describe("--- PrivatelyNFT Contract (Split Tests) ---", function () {
    let provider: JsonRpcProvider;
    let user1: Wallet, user2: Wallet, relayer: Wallet;
    let clientUser1: PrivatelyNFTClient;
    let clientUser2: PrivatelyNFTClient;
    let clientRelayer: PrivatelyNFTClient;
    let nftContract: Contract;

    let mintedTokenId: bigint;
    let createdMintRequest: { request: any; signature: string };
    let createdTransferRequest: { request: any; signature: string };

    /**
     * Retrieve the current balances for user1, user2, and relayer.
     */
    async function getBalances() {
        const [balUser1, balUser2, balRelayer] = await Promise.all([
            provider.getBalance(user1.address),
            provider.getBalance(user2.address),
            provider.getBalance(relayer.address),
        ]);
        return {user1: balUser1, user2: balUser2, relayer: balRelayer};
    }

    /**
     * Verify that only the relayer's balance has decreased after a transaction,
     * while user1 and user2 balances remain unchanged.
     */
    function expectGasIsPaidByRelayer(
        before: { user1: bigint; user2: bigint; relayer: bigint },
        after: { user1: bigint; user2: bigint; relayer: bigint }
    ) {
        expect(after.user1 === before.user1).to.be.true;
        expect(after.user2 === before.user2).to.be.true;
        expect(after.relayer < before.relayer).to.be.true;
    }

    /**
     * Helper to relay a transaction (mint or transfer) from the relayer,
     * then verify that only the relayer paid gas.
     * @param relayFn The function to call (relayMintRequest or relayTransferRequest).
     * @param request The MintRequest or TransferRequest to pass.
     * @param signature The EIP-712 signature.
     */
    async function relayAndCheckGas(
        relayFn: (
            request: any,
            signature: string,
            overrides?: Record<string, any>
        ) => Promise<any>,
        request: any,
        signature: string
    ) {
        const balancesBefore = await getBalances();
        const relayerNonce = await provider.getTransactionCount(
            relayer.address,
            "latest"
        );

        // Send transaction via the chosen relay method
        const tx = await relayFn.call(clientRelayer, request, signature, {
            nonce: relayerNonce,
        });
        const receipt = await tx.wait(1);
        expect(receipt?.status).to.equal(1);

        const balancesAfter = await getBalances();
        expectGasIsPaidByRelayer(await balancesBefore, await balancesAfter);
    }

    before(async function () {
        // Initialize wallets and clients
        provider = new JsonRpcProvider(PROVIDER_URL);
        user1 = new Wallet(USER1_PRIVATE_KEY, provider);
        user2 = new Wallet(USER2_PRIVATE_KEY, provider);
        relayer = new Wallet(RELAYER_PRIVATE_KEY, provider);

        clientUser1 = new PrivatelyNFTClient(user1);
        clientUser2 = new PrivatelyNFTClient(user2);
        clientRelayer = new PrivatelyNFTClient(relayer);

        await clientUser1.init();
        await clientUser2.init();
        await clientRelayer.init();

        nftContract = new Contract(CONTRACT_ADDRESS, ARTIFACT.abi, provider);
    });

    describe("Mint Flow", function () {
        const title = "Test NFT";
        const author = "User1";
        const tokenURI = "ipfs://test-uri";

        it("USER1 should create a mint request", async function () {
            this.timeout(30_000);

            createdMintRequest = await clientUser1.createMintRequest(
                title,
                author,
                tokenURI
            );
            const nonceOnChain = await clientUser1.getNonce(
                createdMintRequest.request.user
            );
            expect(nonceOnChain).to.equal(createdMintRequest.request.nonce);
        });

        it("RELAYER should relay the USER1 mint request and pay gas", async function () {
            this.timeout(30_000);

            await relayAndCheckGas(
                clientRelayer.relayMintRequest,
                createdMintRequest.request,
                createdMintRequest.signature
            );
        });

        it("Minted NFT data should be correct and USER1 should own the NFT", async function () {
            this.timeout(30_000);

            const allNFTs = await clientUser1.getAllNFTs();
            expect(allNFTs.length).to.be.greaterThan(0);

            mintedTokenId = allNFTs[allNFTs.length - 1];
            expect(mintedTokenId).to.exist;

            const insideData = await clientUser1.getInsideData(mintedTokenId);
            expect(insideData.title).to.equal(title);
            expect(insideData.author).to.equal(author);

            const owner = await nftContract.ownerOf(mintedTokenId);
            expect(owner).to.equal(user1.address);
        });
    });

    describe("Transfer Flow", function () {
        it("USER1 should create a transfer request to send NFT to USER2", async function () {
            this.timeout(30_000);

            expect(mintedTokenId).to.exist;
            createdTransferRequest = await clientUser1.createTransferRequest(
                user2.address,
                mintedTokenId
            );
            const nonceOnChain = await clientUser1.getNonce(
                createdTransferRequest.request.from
            );
            expect(nonceOnChain).to.equal(createdTransferRequest.request.nonce);
        });

        it("RELAYER should relay the USER1 transfer request and pay gas", async function () {
            this.timeout(30_000);

            await relayAndCheckGas(
                clientRelayer.relayTransferRequest,
                createdTransferRequest.request,
                createdTransferRequest.signature
            );
        });

        it("Transferred NFT data should be correct and USER2 should receive the NFT", async function () {
            this.timeout(30_000);

            const ownerAfter = await nftContract.ownerOf(mintedTokenId);
            expect(ownerAfter).to.equal(user2.address);

            const insideData = await clientUser2.getInsideData(mintedTokenId);
            expect(insideData.title).to.equal("Test NFT");
            expect(insideData.author).to.equal("User1");
        });
    });

    describe("Ping Pong Transfer Flow", function () {
        it("should ping pong the NFT 10 times with USER2 as final owner", async function () {
            // Increase the timeout for this iteration-heavy test
            this.timeout(120_000);

            for (let i = 0; i < 10; i++) {
                let sender: Wallet;
                let senderClient: PrivatelyNFTClient;
                let receiver: string;

                // Alternate sender/receiver each iteration
                if (i % 2 === 0) {
                    sender = user2;
                    senderClient = clientUser2;
                    receiver = user1.address;
                } else {
                    sender = user1;
                    senderClient = clientUser1;
                    receiver = user2.address;
                }

                // Create a new transfer request
                const transferReq = await senderClient.createTransferRequest(
                    receiver,
                    mintedTokenId
                );
                const nonceOnChain = await senderClient.getNonce(
                    transferReq.request.from
                );
                expect(nonceOnChain).to.equal(transferReq.request.nonce);

                // Relay and ensure Relayer pays gas
                await relayAndCheckGas(
                    clientRelayer.relayTransferRequest,
                    transferReq.request,
                    transferReq.signature
                );

                // Confirm ownership after transfer
                const currentOwner = await nftContract.ownerOf(mintedTokenId);
                expect(currentOwner).to.equal(receiver);

                console.log(`\t\tPingPong #${i + 1} - Transfer complete`);
            }

            // Validate that final owner is USER2
            const finalOwner = await nftContract.ownerOf(mintedTokenId);
            expect(finalOwner).to.equal(user2.address);

            // Ensure inside data is still intact
            const insideData = await clientUser2.getInsideData(mintedTokenId);
            expect(insideData.title).to.equal("Test NFT");
            expect(insideData.author).to.equal("User1");
        });
    });
});
