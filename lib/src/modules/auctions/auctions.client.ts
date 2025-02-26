import { Contract, Network, Signer, TransactionResponse, TypedDataDomain } from "ethers";

import AUCTION_SYSTEM_ARTIFACT from "../../../PrivatelyAuctionSystem.json";
import { RequestSignature, RequestType } from "../../common/request-signature";
import { Auction } from "./auctions.auction";
import { AUCTIONS_BID_REQUEST_TYPE, BidAuctionRequest } from "./auctions.bid.reqest";
import { AUCTIONS_CREATE_REQUEST_TYPE, CreateAuctionRequest } from "./auctions.create.request";
import { AuctionSystemError } from "./auctions.errors";
import { AuctionsNonces } from "./auctions.nonces";



const AUCTION_SYSTEM_ADDRESS = "0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0";



export class PrivatelyAuctionSystemClient {
    public readonly contract: Contract;

    private readonly signer: Signer;
    private readonly domain: TypedDataDomain;


    constructor(
        signer: Signer,
        network: Network
    ) {
        this.signer = signer;
        this.contract = new Contract(AUCTION_SYSTEM_ADDRESS, AUCTION_SYSTEM_ARTIFACT.abi, signer);

        const name: string = AUCTION_SYSTEM_ARTIFACT.contractName;
        this.domain = {
            name,
            version: "1.0.0",
            chainId: network.chainId,
            verifyingContract: AUCTION_SYSTEM_ADDRESS
        };
    }


    /**
     * Retrieves the address of the current deployed contract.
     * @returns The contract address.
     */
    public getContractAddress(): string {
        return AUCTION_SYSTEM_ADDRESS;
    }


    /**
     * Creates and signs a CreateAuctionRequest using EIP-712 structured data.
     * The request can later be relayed to the contract via `relayCreateAuction`.
     * @param tokenId The ID of the NFT being auctioned.
     * @param startPrice The auction's starting price in wei.
     * @param endTime The timestamp at which the auction ends.
     * @returns An object containing the request struct and its signature.
     */
    public async createAuctionRequest(
        tokenId: bigint,
        startPrice: bigint,
        endTime: bigint
    ): Promise<RequestSignature<CreateAuctionRequest>> {
        const seller = await this.signer.getAddress();
        const nonce = (await this.getNonces(seller)).createAuctionNonce;

        const request: CreateAuctionRequest = {
            seller,
            tokenId,
            startPrice,
            endTime,
            nonce
        };

        const signature = await this.signer.signTypedData(
            this.domain,
            AUCTIONS_CREATE_REQUEST_TYPE,
            request
        );

        return new RequestSignature<CreateAuctionRequest>(RequestType.AUCTION_CREATE, signature, request);
    }


    /**
     * Relays a signed CreateAuctionRequest on-chain. The relayer pays gas.
     * @param request The CreateAuctionRequest struct.
     * @param signature The EIP-712 signature that authorizes creating the auction.
     * @returns A TransactionResponse from ethers.
     */
    public async relayCreateAuctionRequest(
        request: CreateAuctionRequest,
        signature: string
    ): Promise<TransactionResponse> {
        try {
            return await this.contract.metaCreateAuction(
                request.seller,
                request.tokenId,
                request.startPrice,
                request.endTime,
                signature
            );
        } catch (error) {
            throw AuctionSystemError.from(error, this.contract);
        }
    }


    /**
     * Creates and signs a BidRequest using EIP-712 structured data.
     * The request can later be relayed to the contract via `relayBid`.
     * @param auctionId The ID of the auction the bidder is bidding on.
     * @param bidAmount The amount in wei the bidder is offering.
     * @returns An object containing the bid request struct and its signature.
     */
    public async createBidRequest(
        auctionId: bigint,
        bidAmount: bigint
    ): Promise<RequestSignature<BidAuctionRequest>> {
        const bidder = await this.signer.getAddress();
        const nonce = (await this.getNonces(bidder)).bidNonce;

        const request: BidAuctionRequest = {
            bidder,
            auctionId,
            bidAmount,
            nonce
        };

        const signature = await this.signer.signTypedData(
            this.domain,
            AUCTIONS_BID_REQUEST_TYPE,
            request
        );

        return new RequestSignature<BidAuctionRequest>(RequestType.AUCTION_BID, signature, request);
    }


    /**
     * Relays a signed bid request (BidRequest) on-chain. The relayer pays gas.
     * IMPORTANT: The relayer must include `bidAmount` in `msg.value` when sending the transaction.
     * @param request The BidRequest struct.
     * @param signature The EIP-712 signature that authorizes the bid.
     * @returns A TransactionResponse from ethers.
     */
    public async relayBidRequest(
        request: BidAuctionRequest,
        signature: string
    ): Promise<TransactionResponse> {
        try {
            return await this.contract.metaBidAuction(
                request.bidder,
                request.auctionId,
                request.bidAmount,
                signature
            );
        } catch (error) {
            throw AuctionSystemError.from(error, this.contract);
        }
    }


    /**
     * Finalizes an auction once the endTime is reached. Anyone can call this.
     * @param auctionId The ID of the auction to finalize.
     * @returns A TransactionResponse.
     */
    public async finalizeAuction(
        auctionId: bigint
    ): Promise<TransactionResponse> {
        try {
            return await this.contract.finalizeAuction(auctionId);
        } catch (error) {
            throw AuctionSystemError.from(error, this.contract);
        }
    }


    /**
     * Allows users to withdraw their pending refunds from previous unsuccessful bids.
     * @returns A TransactionResponse.
     */
    public async withdraw(): Promise<TransactionResponse> {
        try {
            return await this.contract.withdraw();
        } catch (error) {
            throw AuctionSystemError.from(error, this.contract);
        }
    }


    /**
     * Retrieves all auction IDs created in the contract.
     * @returns An array of auction IDs.
     */
    public async getAllAuctions(): Promise<bigint[]> {
        try {
            return await this.contract.getAllAuctions();
        } catch (error) {
            throw AuctionSystemError.from(error, this.contract);
        }
    }


    /**
     * Retrieves all active auction IDs in the contract.
     * @returns An array of active auction IDs.
     */
    public async getAllActiveAuctions(): Promise<Auction[]> {
        try {
            const auctionList = await this.contract.getAllActiveAuctions();
            return await Auction.map(auctionList, this);
        } catch (error) {
            throw AuctionSystemError.from(error, this.contract);
        }
    }


    /**
     * Retrieves all auction IDs created by a specific seller.
     * @param seller The address of the seller to fetch auctions for.
     * @returns An array of Auction objects.
     */
    public async getSellerAuctions(
        seller: string
    ): Promise<Auction[]> {
        try {
            const auctionList = await this.contract.getSellerAuctions(seller);
            return await Auction.map(auctionList, this);
        } catch (error) {
            throw AuctionSystemError.from(error, this.contract);
        }
    }


    /**
     * Retrieves all auction IDs created by the client's signer address.
     * @returns An array of Auction objects.
     */
    public async getAuctions(): Promise<Auction[]> {
        return this.getSellerAuctions(await this.signer.getAddress());
    }


    /**
     * Retrieves the auction details for a specific auction ID.
     * @param auctionId The ID of the auction to fetch.
     * @returns An Auction object.
     */
    public async getAuction(auctionId: bigint): Promise<Auction> {
        try {
            const auction = await this.contract.getAuction(auctionId);
            return new Auction(
                auctionId,
                auction.seller,
                auction.tokenId,
                auction.startPrice,
                auction.highestBid,
                auction.highestBidder,
                auction.endTime,
                auction.settled
            );
        } catch (error) {
            throw AuctionSystemError.from(error, this.contract);
        }
    }


    /**
     * Fetches the current nonces for a user.
     * @param userAddress The address of the user to fetch the nonce for.
     * @returns An object containing the nonces.
     */
    private async getNonces(userAddress: string): Promise<AuctionsNonces> {
        try {
            const nonce = await this.contract.getNonces(userAddress);
            return {createAuctionNonce: nonce.createAuctionNonce, bidNonce: nonce.bidNonce};
        } catch (error) {
            throw AuctionSystemError.from(error, this.contract);
        }
    }
}