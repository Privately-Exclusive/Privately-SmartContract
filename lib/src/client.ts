import { Block, Network, Signer } from "ethers";
import { PrivatelyError } from "./common/privately.error";
import { PrivatelyAuctionSystemClient } from "./modules/auctions/auctions.client";
import { PrivatelyCoinClient } from "./modules/coin/coin.client";
import { PrivatelyCollectionClient } from "./modules/collection/collection.client";



export class PrivatelyClient {

    public readonly signer: Signer;

    public readonly coin: PrivatelyCoinClient;
    public readonly collection: PrivatelyCollectionClient;
    public readonly auctions: PrivatelyAuctionSystemClient;



    private constructor(signer: Signer, network: Network) {
        this.signer = signer;
        this.coin = new PrivatelyCoinClient(signer, network);
        this.collection = new PrivatelyCollectionClient(signer, network);
        this.auctions = new PrivatelyAuctionSystemClient(signer, network);
    }


    /**
     * Creates a new PrivatelyClient instance using the provided signer.
     * @param signer The signer to use for transactions.
     * @returns A new PrivatelyClient instance.
     * @constructor
     */
    public static async create(signer: Signer): Promise<PrivatelyClient> {
        if (!signer.provider) throw new Error("Signer must be connected to a provider.");
        const network = await signer.provider.getNetwork();
        return new PrivatelyClient(signer, network);
    }


    /**
     * Fetches the latest block from the connected provider.
     * @returns The latest block.
     */
    public async getLastBlock(): Promise<Block> {
        const provider = this.signer.provider;
        if (!provider) throw new PrivatelyError("Signer must be connected to a provider.");

        const block = await provider.getBlock("latest");
        if (!block) throw new PrivatelyError("Failed to fetch the latest block.");

        return block;
    }


    /**
     * Fetches the timestamp of the latest block from the connected provider.
     * @returns The timestamp of the latest block in seconds.
     */
    public async getLastBlockTimestamp(): Promise<number> {
        const block = await this.getLastBlock();
        return block.timestamp;
    }


    /**
     * Fetches the address (public key) of the connected signer.
     * @returns The address of the signer.
     */
    public getAddress(): Promise<string> {
        return this.signer.getAddress();
    }
}