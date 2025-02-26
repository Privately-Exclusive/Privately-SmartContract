import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { JsonRpcProvider, Wallet } from "ethers";
import { before, describe, it } from "mocha";
import { PrivatelyClient } from "../src";
import { RequestType } from "../src/common/request-signature";
import { CoinError } from "../src/modules/coin/coin.errors";



const PROVIDER_URL = "http://127.0.0.1:8545/";
const RELAYER_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const USER3_PRIVATE_KEY = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";


chai.use(chaiAsPromised);


export const coinTests = function () {
    let relayerClient: PrivatelyClient;
    let relayerAddress: string;

    let user1Client: PrivatelyClient;
    let user1Address: string;

    let user2Client: PrivatelyClient;
    let user2Address: string;

    let user3Client: PrivatelyClient;
    let user3Address: string;

    before(async function () {
        const provider = new JsonRpcProvider(PROVIDER_URL);

        const relayerWallet = new Wallet(RELAYER_PRIVATE_KEY, provider);
        relayerAddress = relayerWallet.address;
        const user1Wallet = Wallet.createRandom(provider);
        user1Address = user1Wallet.address;
        const user2Wallet = Wallet.createRandom(provider);
        user2Address = user2Wallet.address;
        const user3Wallet = new Wallet(USER3_PRIVATE_KEY, provider);
        user3Address = user3Wallet.address;

        relayerClient = await PrivatelyClient.create(relayerWallet);
        user1Client = await PrivatelyClient.create(user1Wallet);
        user2Client = await PrivatelyClient.create(user2Wallet);
        user3Client = await PrivatelyClient.create(user3Wallet);
    });

    describe("Initial State", function () {
        it("Should initialize with zero balances and supply", async function () {
            await expect(relayerClient.coin.getBalance()).to.eventually.equal(0n);
            await expect(user1Client.coin.getBalance()).to.eventually.equal(0n);
            await expect(user2Client.coin.getBalance()).to.eventually.equal(0n);
            await expect(user3Client.coin.getBalance()).to.eventually.equal(0n);
            await expect(relayerClient.coin.totalSupply()).to.eventually.equal(0n);
        });
    });

    describe("Minting", function () {
        it("RELAYER should be able to mint tokens", async function () {
            this.timeout(15000);

            const tx = await relayerClient.coin.mint(relayerAddress, 1000n);
            await tx.wait();

            expect(await relayerClient.coin.getBalance()).to.equal(1000n);
            expect(await relayerClient.coin.totalSupply()).to.equal(1000n);
        });

        it("USER1 should not be able to mint tokens", async function () {
            await expect(user1Client.coin.mint(user1Address, 100n))
                .to.be.rejectedWith(CoinError);
        });
    });

    describe("Direct Transfers", function () {
        it("RELAYER should transfer to USER1", async function () {
            this.timeout(15000);

            const tx = await relayerClient.coin.transfer(user1Address, 500n);
            await tx.wait();

            expect(await relayerClient.coin.getBalance()).to.equal(500n);
            expect(await user1Client.coin.getBalance()).to.equal(500n);
        });

        it("Should prevent overdraft transfers", async function () {
            await expect(user1Client.coin.transfer(user2Address, 600n))
                .to.be.rejectedWith(CoinError);
        });

        it("Should handle zero-amount transfers", async function () {
            await expect(user1Client.coin.transfer(user2Address, 0n))
                .to.be.rejectedWith(CoinError);
        });
    });

    describe("Meta-Transactions", function () {
        it("USER1 should create valid transfer request", async function () {
            const request = await user1Client.coin.createTransferRequest(
                user1Address,
                user2Address,
                100n
            );
            expect(request.type).to.equal(RequestType.COIN_TRANSFER);

            expect(request.request.from).to.equal(user1Address);
            expect(request.request.amount).to.equal(100n);
        });

        it("RELAYER should process valid transfer request", async function () {
            this.timeout(15000);

            const initialBalance = await user1Client.coin.getBalance();
            const {request, signature} = await user1Client.coin.createTransferRequest(
                user1Address,
                user2Address,
                100n
            );

            const tx = await relayerClient.coin.relayTransferRequest(request, signature);
            await tx.wait();

            expect(await user1Client.coin.getBalance()).to.equal(initialBalance - 100n);
        });

        it("Should reject invalid signatures", async function () {
            const {request} = await user1Client.coin.createTransferRequest(
                user1Address,
                user2Address,
                100n
            );

            await expect(relayerClient.coin.relayTransferRequest(request, "0xinvalid"))
                .to.be.rejectedWith(CoinError);
        });

        it("Should prevent nonce reuse", async function () {
            const {request, signature} = await user1Client.coin.createTransferRequest(
                user1Address,
                user2Address,
                50n
            );

            await relayerClient.coin.relayTransferRequest(request, signature);
            await expect(relayerClient.coin.relayTransferRequest(request, signature))
                .to.be.rejectedWith(CoinError);
        });
    });

    describe("Approvals", function () {
        it("USER3 should approve RELAYER spending", async function () {
            this.timeout(15000);

            const tx = await user3Client.coin.approve(relayerAddress, 300n);
            await tx.wait();

            expect(await user3Client.coin.allowance(user3Address, relayerAddress))
                .to.equal(300n);
        });

        it("RELAYER should spend from allowance", async function () {
            this.timeout(30000);

            let tx = await relayerClient.coin.mint(user3Address, 200n);
            await tx.wait();

            const initialBalance = await user2Client.coin.getBalance();
            tx = await relayerClient.coin.transferFrom(
                user3Address,
                user2Address,
                200n
            );
            await tx.wait();

            expect(await user2Client.coin.getBalance()).to.equal(initialBalance + 200n);
            expect(await user3Client.coin.allowance(user3Address, relayerAddress))
                .to.equal(100n);
        });

        it("Should reject overspending from allowance", async function () {
            await expect(relayerClient.coin.transferFrom(
                user3Address,
                user2Address,
                200n
            )).to.be.rejectedWith(CoinError);
        });
    });

    describe("Meta-Approvals", function () {
        it("USER3 should create valid approval request", async function () {
            const request = await user3Client.coin.createApproveRequest(
                relayerAddress,
                500n
            );
            expect(request.type).to.equal(RequestType.COIN_APPROVE);

            expect(request.request.spender).to.equal(relayerAddress);
            expect(request.request.amount).to.equal(500n);
        });

        it("RELAYER should process valid approval request", async function () {
            this.timeout(15000);

            const {request, signature} = await user3Client.coin.createApproveRequest(
                relayerAddress,
                500n
            );

            const tx = await relayerClient.coin.relayApproveRequest(request, signature);
            await tx.wait();

            expect(await user3Client.coin.allowance(user3Address, relayerAddress))
                .to.equal(500n);
        });
    });

    describe("Edge Cases", function () {
        it("Should handle total supply tracking", async function () {
            this.timeout(15000);

            const initialSupply = await relayerClient.coin.totalSupply();

            const tx = await relayerClient.coin.mint(relayerAddress, 100n);
            await tx.wait();

            expect(await relayerClient.coin.totalSupply()).to.equal(initialSupply + 100n);
        });

        it("Should validate user balances", async function () {
            expect(await user1Client.coin.getUserBalance(user2Address))
                .to.equal(await user2Client.coin.getBalance());
        });

        it("Should reject mismatched meta-transfer sender", async function () {
            const {request, signature} = await user1Client.coin.createTransferRequest(
                relayerAddress,
                user2Address,
                100n
            );

            await expect(relayerClient.coin.relayTransferRequest(request, signature))
                .to.be.rejectedWith(CoinError);
        });
    });
};
