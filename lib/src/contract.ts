import { BigNumberish, Contract, JsonRpcProvider, Signer, TransactionResponse, TypedDataDomain, TypedDataField } from "ethers";


/**
 * Represents the data needed to create a mint request (EIP-712).
 */
export interface MintRequest {
    user: string;
    title: string;
    author: string;
    tokenURI: string;
    nonce: number;
}



/**
 * Represents the data needed to create a transfer request (EIP-712).
 */
export interface TransferRequest {
    from: string;
    to: string;
    tokenId: BigNumberish;
    nonce: number;
}



/**
 * Deployed address of the PrivatelyNFT contract.
 */
const CONTRACT_ADDRESS = "0x5fbdb2315678afecb367f032d93f642f64180aa3";



/**
 * A client class to interact with the PrivatelyNFT smart contract.
 * This class facilitates:
 *  - Creating and signing Mint/Transfer requests using EIP-712 signatures.
 *  - Relaying these signed requests to the blockchain.
 *  - Retrieving NFT-related data and user nonce information.
 */
export class PrivatelyNFTClient {
    /** The Signer provided by the constructor, used to sign EIP-712 data. */
    signer: Signer;
    /** An ethers.js Contract instance connected to the PrivatelyNFT contract. */
    private contract: Contract;
    /** A JsonRpcProvider extracted from the Signer for direct network interactions. */
    private provider: JsonRpcProvider;

    /** The EIP-712 domain information used when signing typed data. */
    private domain: TypedDataDomain;

    /** The typed data structure for MintRequest (EIP-712). */
    private mintRequestTypes: Record<string, TypedDataField[]>;

    /** The typed data structure for TransferRequest (EIP-712). */
    private transferRequestTypes: Record<string, TypedDataField[]>;


    /**
     * Creates an instance of the PrivatelyNFTClient, linking it to a specific Signer.
     * @param signer A Signer object connected to an ethers provider.
     * @param artifact The JSON artifact of the PrivatelyNFT contract.
     */
    constructor(signer: Signer, artifact: any) {
        this.signer = signer;
        this.provider = signer.provider as JsonRpcProvider;
        this.contract = new Contract(CONTRACT_ADDRESS, artifact.abi, this.signer);

        // Use the contract name from the artifact if available, otherwise fallback to "PrivatelyNFT".
        const name: string = artifact.contractName;

        // Set up the default EIP-712 domain, with chainId to be updated in init().
        this.domain = {
            name,
            version: "1.0.0",
            chainId: 0,
            verifyingContract: CONTRACT_ADDRESS
        };

        // Typed data definitions for MintRequest.
        this.mintRequestTypes = {
            MintRequest: [
                {name: "user", type: "address"},
                {name: "title", type: "string"},
                {name: "author", type: "address"},
                {name: "tokenURI", type: "string"},
                {name: "nonce", type: "uint256"}
            ]
        };

        // Typed data definitions for TransferRequest.
        this.transferRequestTypes = {
            TransferRequest: [
                {name: "from", type: "address"},
                {name: "to", type: "address"},
                {name: "tokenId", type: "uint256"},
                {name: "nonce", type: "uint256"}
            ]
        };
    }


    /**
     * Initializes the client by fetching the network chainId and updating the EIP-712 domain.
     */
    public async init(): Promise<void> {
        const network = await this.provider.getNetwork();
        this.domain.chainId = network.chainId;
    }


    /**
     * Retrieves a list of all NFT token IDs currently stored in the contract.
     * @returns An array of token IDs as bigint.
     */
    public async getAllNFTs(): Promise<bigint[]> {
        return await this.contract.getAllNFTs();
    }


    /**
     * Retrieves the list of NFT token IDs owned by a specific user.
     * @param owner The address of the user whose NFTs should be retrieved.
     * @returns An array of token IDs as bigint.
     */
    public async getNFTsOfUser(owner: string): Promise<bigint[]> {
        return await this.contract.getNFTsOfUser(owner);
    }


    /**
     * Retrieves the list of NFT token IDs owned by the client's signer address.
     * @returns An array of token IDs as bigint.
     */
    public async getNFTs(): Promise<bigint[]> {
        return await this.contract.getNFTsOfUser(await this.signer.getAddress());
    }


    /**
     * Fetches the on-chain metadata (title, author, and tokenURI) for a given token ID.
     * @param tokenId The ID of the NFT (as BigNumberish).
     * @returns An object containing title, author, and tokenURI strings.
     */
    public async getData(
        tokenId: BigNumberish
    ): Promise<{title: string; author: string; tokenURI: string}> {
        const data = await this.contract.getData(tokenId);
        return {
            title: data.title,
            author: data.author,
            tokenURI: data.tokenURI_
        };
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
    ): Promise<{request: MintRequest; signature: string}> {
        const userAddress = await this.signer.getAddress();
        const nonce = await this.getNonce();

        const request: MintRequest = {
            user: userAddress,
            title: title,
            author: userAddress,
            tokenURI: tokenURI,
            nonce: nonce
        };

        const signature = await this.signer.signTypedData(
            this.domain,
            this.mintRequestTypes,
            request
        );
        return {request, signature};
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
    ): Promise<{request: TransferRequest; signature: string}> {
        const from = await this.signer.getAddress();
        const nonce = await this.getNonce();


        const request: TransferRequest = {
            from,
            to,
            tokenId,
            nonce
        };

        const signature = await this.signer.signTypedData(
            this.domain,
            this.transferRequestTypes,
            request
        );
        return {request, signature};
    }


    /**
     * Relays a signed mint request to the blockchain.
     * The relayer (caller of this function) is responsible for the transaction's gas cost.
     * @param request The MintRequest object containing user, title, author, tokenURI, and nonce.
     * @param signature The EIP-712 signature that authorizes this mint.
     * @returns A TransactionResponse object from ethers.
     */
    public async relayMintRequest(
        request: MintRequest,
        signature: string
    ): Promise<TransactionResponse> {
        return await this.contract.mintGaslessNFT(
            request.user,
            request.title,
            request.tokenURI,
            signature
        );
    }


    /**
     * Relays a signed transfer request to the blockchain.
     * The relayer (caller of this function) is responsible for the transaction's gas cost.
     * @param request The TransferRequest object containing from, to, tokenId, and nonce.
     * @param signature The EIP-712 signature that authorizes this transfer.
     * @returns A TransactionResponse object from ethers.
     */
    public async relayTransferRequest(
        request: TransferRequest,
        signature: string
    ): Promise<TransactionResponse> {
        return await this.contract.transferGasless(
            request.from,
            request.to,
            request.tokenId,
            signature
        );
    }


    private async getNonce(): Promise<number> {
        return Number(await this.contract.getNonce(this.signer.getAddress()));
    }
}
