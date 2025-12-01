import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { JsonRpcProvider, Wallet } from "ethers";
import { before } from "mocha";
import { CollectionMintRequest, PrivatelyClient } from "../src";
import { RequestSignature } from "../src/common/request-signature";



const PROVIDER_URL = "http://127.0.0.1:8545/";
const RELAYER_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const USER1_PRIVATE_KEY = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";

chai.use(chaiAsPromised);


export const systemTests = function () {

    let user1Client: PrivatelyClient;


    before(async function () {
        const provider = new JsonRpcProvider(PROVIDER_URL);

        const user1Wallet = new Wallet(USER1_PRIVATE_KEY, provider);

        user1Client = await PrivatelyClient.create(user1Wallet);
    });

    it("should return error if we create a PrivatelyClient without a provider", async () => {
        const wallet = new Wallet(RELAYER_PRIVATE_KEY);
        await expect(PrivatelyClient.create(wallet)).to.be.rejectedWith(Error);
    });

    it("should create a request, serialize it, and deserialize it", async () => {
        const request = await user1Client.collection.createMintRequest(
            "Test NFT",
            "https://example.com/test.json"
        );

        const serial = request.serialize();
        expect(serial).to.be.a("string");
        const deserialized = RequestSignature.deserialize<CollectionMintRequest>(serial);
        expect(deserialized).to.be.an.instanceOf(RequestSignature<CollectionMintRequest>);

        expect(deserialized.request.user).to.equal(await user1Client.getAddress());
        expect(deserialized.request.title).to.equal("Test NFT");
    });
};