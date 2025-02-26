import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { JsonRpcProvider, Wallet } from "ethers";
import { before } from "mocha";
import { CoinTransferRequest, PrivatelyClient } from "../src";
import { RequestSignature } from "../src/common/request-signature";



const PROVIDER_URL = "http://127.0.0.1:8545/";
const RELAYER_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const USER1_PRIVATE_KEY = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
const USER2_PRIVATE_KEY = "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a";

chai.use(chaiAsPromised);


export const systemTests = function () {

    let user1Client: PrivatelyClient;
    let user2Client: PrivatelyClient;


    before(async function () {
        const provider = new JsonRpcProvider(PROVIDER_URL);

        const user1Wallet = new Wallet(USER1_PRIVATE_KEY, provider);
        const user2Wallet = new Wallet(USER2_PRIVATE_KEY, provider);

        user1Client = await PrivatelyClient.create(user1Wallet);
        user2Client = await PrivatelyClient.create(user2Wallet);
    });

    it("should return error if we create a PrivatelyClient without a provider", async () => {
        const wallet = new Wallet(RELAYER_PRIVATE_KEY);
        await expect(PrivatelyClient.create(wallet)).to.be.rejectedWith(Error);
    });

    it("should create a request, serialize it, and deserialize it", async () => {
        const request = await user1Client.coin.createTransferRequest(
            await user1Client.getAddress(),
            await user2Client.getAddress(),
            100n
        );

        const serial = request.serialize();
        expect(serial).to.be.a("string");
        const deserialized = RequestSignature.deserialize<CoinTransferRequest>(serial);
        expect(deserialized).to.be.an.instanceOf(RequestSignature<CoinTransferRequest>);

        expect(deserialized.request.from).to.equal(await user1Client.getAddress());
        expect(deserialized.request.amount).to.equal(100n);
    });
};