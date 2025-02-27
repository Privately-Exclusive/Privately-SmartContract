import { Block, Network, Signer, TransactionResponse } from "ethers";
import { PrivatelyError } from "./common";
import { PrivatelyAuctionSystemClient } from "./modules/auctions";
import { PrivatelyCoinClient } from "./modules/coin";
import { PrivatelyCollectionClient } from "./modules/collection";



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


    /**
     * Fetches a transaction by its hash.
     * @param txHash The hash of the transaction to fetch.
     * @returns The transaction if found, otherwise null.
     */
    public async getTransaction(txHash: string): Promise<TransactionResponse | null> {
        return (await this.signer.provider?.getTransaction(txHash)) ?? null;
    }
}