import { BigNumberish, Contract, Network, Signer, TransactionResponse, TypedDataDomain } from "ethers";

import COLLECTION_ARTIFACT from "../../../PrivatelyCollection.json";
import { RequestSignature, RequestType } from "../../common/request-signature";
import { COLLECTION_APPROVE_REQUEST_TYPE, CollectionApproveRequest } from "./collection.approve.request";
import { CollectionError } from "./collection.errors";
import { COLLECTION_MINT_REQUEST_TYPE, CollectionMintRequest } from "./collection.mint.request";
import { PrivatelyNFT } from "./collection.nft";
import { CollectionNonces } from "./collection.nonces";
import { COLLECTION_TRANSFER_REQUEST_TYPE, CollectionTransferRequest } from "./collection.transfer.request";



const COLLECTION_ADDRESS = "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512";



export class PrivatelyCollectionClient {
    public readonly contract: Contract;

    private readonly signer: Signer;
    private readonly domain: TypedDataDomain;


    constructor(
        signer: Signer,
        network: Network
    ) {
        this.signer = signer;
        this.contract = new Contract(COLLECTION_ADDRESS, COLLECTION_ARTIFACT.abi, signer);

        const name: string = COLLECTION_ARTIFACT.contractName;
        this.domain = {
            name,
            version: "1.0.0",
            chainId: network.chainId,
            verifyingContract: COLLECTION_ADDRESS
        };
    }


    /**
     * Retrieves a list of all NFT token IDs currently stored in the contract.
     * @returns An array of token IDs as bigint.
     */
    public async getSupplyCollection(): Promise<bigint[]> {
        try {
            return await this.contract.getAllCollection();
        } catch (error) {
            throw CollectionError.from(error, this.contract);
        }
    }


    /**
     * Retrieves the list of NFT token IDs owned by a specific user.
     * @param owner The address of the user whose Collection should be retrieved.
     * @returns An array of token IDs as bigint.
     */
    public async getUserCollection(owner: string): Promise<PrivatelyNFT[]> {
        try {
            const collection = await this.contract.getCollectionOfUser(owner);
            return await PrivatelyNFT.map(collection, this);
        } catch (error) {
            throw CollectionError.from(error, this.contract);
        }
    }


    /**
     * Retrieves the list of NFT token IDs owned by the client's signer address.
     * @returns An array of token IDs as bigint.
     */
    public async getCollection(): Promise<PrivatelyNFT[]> {
        const myAddress = await this.signer.getAddress();

        try {
            const collection = await this.contract.getCollectionOfUser(myAddress);
            return await PrivatelyNFT.map(collection, this);
        } catch (error) {
            throw CollectionError.from(error, this.contract);
        }
    }


    /**
     * Fetches the metadata for a specific NFT token ID.
     * @param tokenId The ID of the NFT (as BigNumberish).
     * @returns A PrivatelyNFT object containing the NFT's metadata.
     */
    public async getData(tokenId: BigNumberish): Promise<PrivatelyNFT> {
        try {
            const data = await this.contract.getData(tokenId);
            return new PrivatelyNFT(tokenId, data.title, data.author, data.uri);
        } catch (error) {
            throw CollectionError.from(error, this.contract);
        }
    }


    /**
     * Creates and signs a MintRequest using EIP-712 structured data.
     * This request can later be relayed to the contract via `relayMintRequest`.
     * @param title The NFT title.
     * @param tokenURI The URI for the NFT metadata.
     * @returns An object containing the mint request struct and its EIP-712 signature.
     */
    public async createMintRequest(
        title: string,
        tokenURI: string
    ): Promise<RequestSignature<CollectionMintRequest>> {
        if (!title.trim()) throw new CollectionError("Title cannot be empty");
        if (!tokenURI.trim()) throw new CollectionError("Token URI cannot be empty");

        const userAddress = await this.signer.getAddress();
        const nonce = (await this.getNonces()).mintNonce;

        const request: CollectionMintRequest = {
            user: userAddress,
            title: title,
            author: userAddress,
            tokenURI: tokenURI,
            nonce: nonce
        };

        const signature = await this.signer.signTypedData(
            this.domain,
            COLLECTION_MINT_REQUEST_TYPE,
            request
        );
        return {type: RequestType.COLLECTION_MINT, request, signature};
    }


    /**
     * Relays a signed mint request to the blockchain.
     * The relayer (caller of this function) is responsible for the transaction's gas cost.
     * @param request The MintRequest object containing user, title, author, tokenURI, and nonce.
     * @param signature The EIP-712 signature that authorizes this mint.
     * @returns A TransactionResponse object from ethers.
     */
    public async relayMintRequest(
        request: CollectionMintRequest,
        signature: string
    ): Promise<TransactionResponse> {
        try {
            return await this.contract.metaMint(
                request.user,
                request.title,
                request.tokenURI,
                signature
            );
        } catch (error) {
            throw CollectionError.from(error, this.contract);
        }
    }


    /**
     * Creates and signs a TransferRequest using EIP-712 structured data.
     * This request can later be relayed to the contract via `relayTransferRequest`.
     * @param to The address to which the NFT should be transferred.
     * @param tokenId The ID of the NFT (BigNumberish).
     * @returns An object containing the transfer request struct and its EIP-712 signature.
     */
    public async createTransferRequest(
        to: string,
        tokenId: BigNumberish
    ): Promise<RequestSignature<CollectionTransferRequest>> {
        const from = await this.signer.getAddress();
        const nonce = (await this.getNonces()).transferNonce;

        const request: CollectionTransferRequest = {
            from,
            to,
            tokenId,
            nonce
        };

        const signature = await this.signer.signTypedData(
            this.domain,
            COLLECTION_TRANSFER_REQUEST_TYPE,
            request
        );
        return {type: RequestType.COLLECTION_TRANSFER, request, signature};
    }


    /**
     * Relays a signed transfer request to the blockchain.
     * The relayer (caller of this function) is responsible for the transaction's gas cost.
     * @param request The TransferRequest object containing from, to, tokenId, and nonce.
     * @param signature The EIP-712 signature that authorizes this transfer.
     * @returns A TransactionResponse object from ethers.
     */
    public async relayTransferRequest(
        request: CollectionTransferRequest,
        signature: string
    ): Promise<TransactionResponse> {
        try {
            return await this.contract.metaTransfer(
                request.from,
                request.to,
                request.tokenId,
                signature
            );
        } catch (error) {
            throw CollectionError.from(error, this.contract);
        }
    }


    /**
     * Creates and signs an ApproveRequest using EIP-712 structured data.
     * @param spender The address to which the approval should be granted.
     * @param tokenId The ID of the NFT (BigNumberish).
     * @returns An object containing the approval request struct and its EIP-712 signature.
     */
    public async createApproveRequest(
        spender: string,
        tokenId: BigNumberish
    ): Promise<RequestSignature<CollectionApproveRequest>> {
        const owner = await this.signer.getAddress();
        const nonce = (await this.getNonces()).approveNonce;

        const request: CollectionApproveRequest = {
            owner,
            spender,
            tokenId,
            nonce
        };

        const signature = await this.signer.signTypedData(
            this.domain,
            COLLECTION_APPROVE_REQUEST_TYPE,
            request
        );
        return {type: RequestType.COLLECTION_APPROVE, request, signature};
    }


    /**
     * Relays a signed approval request to the blockchain.
     * The relayer (caller of this function) is responsible for the transaction's gas cost.
     * @param request The ApproveRequest object containing owner, spender, tokenId, and nonce.
     * @param signature The EIP-712 signature that authorizes this approval.
     * @returns A TransactionResponse object from ethers.
     */
    public async relayApproveRequest(
        request: CollectionApproveRequest,
        signature: string
    ): Promise<TransactionResponse> {
        try {
            return await this.contract.metaApprove(
                request.owner,
                request.spender,
                request.tokenId,
                signature
            );
        } catch (error) {
            throw CollectionError.from(error, this.contract);
        }
    }


    /**
     * Retrieves current nonce for meta-transactions
     * @returns Current nonce for signer's address
     */
    private async getNonces(): Promise<CollectionNonces> {
        const selfAddress = await this.signer.getAddress();

        try {
            const nonces = await this.contract.getNonces(selfAddress);
            return {mintNonce: nonces.mintNonce, transferNonce: nonces.transferNonce, approveNonce: nonces.approveNonce};
        } catch (error) {
            throw CollectionError.from(error, this.contract);
        }
    }
}