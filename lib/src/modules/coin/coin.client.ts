import { Contract, Network, Signer, TransactionResponse, TypedDataDomain } from "ethers";

import COIN_ARTIFACT from "../../../PrivatelyCoin.json";
import { RequestSignature } from "../../common/request-signature";
import { APPROVE_REQUEST_TYPE, CoinApproveRequest } from "./coin.approve.request";
import { CoinError } from "./coin.errors";
import { CoinNonces } from "./coin.nonces";
import { CoinTransferRequest, TRANSFER_REQUEST_TYPE } from "./coin.transfer.request";



const COIN_CONTRACT_ADDRESS = "0x5fbdb2315678afecb367f032d93f642f64180aa3";



/**
 * CoinClient class to interact with the PrivatelyCoin smart contract
 */
export class PrivatelyCoinClient {
    public readonly contract: Contract;

    private readonly signer: Signer;
    private readonly domain: TypedDataDomain;


    /**
     * Constructs a CoinClient instance to interact with the token contract
     * @param signer The transaction signer (wallet with private key)
     * @param network Network configuration for blockchain connection
     */
    constructor(
        signer: Signer,
        network: Network
    ) {
        this.signer = signer;
        this.contract = new Contract(COIN_CONTRACT_ADDRESS, COIN_ARTIFACT.abi, signer);

        const name: string = COIN_ARTIFACT.contractName;
        this.domain = {
            name,
            version: "1.0.0",
            chainId: network.chainId,
            verifyingContract: COIN_CONTRACT_ADDRESS
        };
    }


    /**
     * Creates a signed transfer request for meta-transaction execution
     * @param from Sender address
     * @param to Recipient address
     * @param amount Token amount to transfer
     * @returns Promise containing transfer request and EIP-712 signature
     */
    public async createTransferRequest(
        from: string,
        to: string,
        amount: bigint
    ): Promise<RequestSignature<CoinTransferRequest>> {
        const nonce = (await this.getNonces()).transferNonce;

        const request: CoinTransferRequest = {
            from: from,
            to: to,
            amount: amount,
            nonce: nonce
        };
        const signature = await this.signer.signTypedData(
            this.domain,
            TRANSFER_REQUEST_TYPE,
            request
        );
        return {request, signature};
    }


    /**
     * Relays a signed transfer request to execute as a meta-transaction
     * @param request Signed transfer request object
     * @param signature EIP-712 signature of the request
     * @returns Blockchain transaction response
     */
    public async relayTransferRequest(
        request: CoinTransferRequest,
        signature: string
    ): Promise<TransactionResponse> {
        try {
            return await this.contract.metaTransfer(
                request.from,
                request.to,
                request.amount,
                signature
            );
        } catch (error) {
            throw CoinError.from(error, this.contract);
        }
    }


    /**
     * Creates a signed allowance approval request for meta-transaction execution
     * @param spender Authorized spending address
     * @param amount Approved token amount
     * @returns Promise containing approval request and EIP-712 signature
     */
    public async createApproveRequest(
        spender: string,
        amount: bigint
    ): Promise<RequestSignature<CoinApproveRequest>> {
        const owner = await this.signer.getAddress();
        const nonce = (await this.getNonces()).approveNonce;

        const request: CoinApproveRequest = {
            owner: owner,
            spender: spender,
            amount: amount,
            nonce: nonce
        };

        const signature = await this.signer.signTypedData(
            this.domain,
            APPROVE_REQUEST_TYPE,
            request
        );

        return {request, signature};
    }


    /**
     * Relays a signed approval request to execute as a meta-transaction
     * @param request Signed approval request object
     * @param signature EIP-712 signature of the request
     * @returns Blockchain transaction response
     * @throws If signature verification fails or nonce mismatch occurs
     */
    public async relayApproveRequest(
        request: CoinApproveRequest,
        signature: string
    ): Promise<TransactionResponse> {
        try {
            return await this.contract.metaApprove(
                request.owner,
                request.spender,
                request.amount,
                signature
            );
        } catch (error) {
            throw CoinError.from(error, this.contract);
        }
    }


    /**
     * Mints new tokens (requires minter role)
     * @param to Recipient address
     * @param amount Amount to mint
     * @returns Blockchain transaction response
     */
    public async mint(
        to: string,
        amount: bigint
    ): Promise<TransactionResponse> {
        try {
            return await this.contract.mint(to, amount);
        } catch (error) {
            throw CoinError.from(error, this.contract);
        }
    }


    /**
     * Executes standard ERC20 token transfer
     * @param to Recipient address
     * @param amount Amount to transfer
     * @returns Blockchain transaction response
     */
    public async transfer(
        to: string,
        amount: bigint
    ): Promise<TransactionResponse> {
        try {
            return await this.contract.transfer(to, amount);
        } catch (error) {
            throw CoinError.from(error, this.contract);
        }
    }


    /**
     * Approves spending allowance for a spender address
     * @param spender Authorized spending address
     * @param amount Approved amount
     * @returns Blockchain transaction response
     */
    public async approve(
        spender: string,
        amount: bigint
    ): Promise<TransactionResponse> {
        try {
            return await this.contract.approve(spender, amount);
        } catch (error) {
            throw CoinError.from(error, this.contract);
        }
    }


    /**
     * Gets remaining approved spending allowance
     * @param owner Token owner address
     * @param spender Authorized spender address
     * @returns Remaining allowed amount
     */
    public async allowance(
        owner: string,
        spender: string
    ): Promise<bigint> {
        try {
            return await this.contract.allowance(owner, spender);
        } catch (error) {
            throw CoinError.from(error, this.contract);
        }
    }


    /**
     * Transfers tokens from an approved address
     * @param from Source address (must have allowance)
     * @param to Recipient address
     * @param amount Amount to transfer
     * @returns Blockchain transaction response
     */
    public async transferFrom(
        from: string,
        to: string,
        amount: bigint
    ): Promise<TransactionResponse> {
        try {
            return await this.contract.transferFrom(from, to, amount);
        } catch (error) {
            throw CoinError.from(error, this.contract);
        }
    }


    /**
     * Retrieves total token supply
     * @returns Total circulating token amount
     */
    public async totalSupply(): Promise<bigint> {
        try {
            return await this.contract.totalSupply();
        } catch (error) {
            throw CoinError.from(error, this.contract);
        }
    }


    /**
     * Gets token balance for a specific address
     * @param user Address to check
     * @returns Current token balance
     */
    public async getUserBalance(user: string): Promise<bigint> {
        try {
            return this.contract.balanceOf(user);
        } catch (error) {
            throw CoinError.from(error, this.contract);
        }
    }


    /**
     * Retrieves current balance for the signer's address
     * @returns Current token balance for signer
     */
    public async getBalance(): Promise<bigint> {
        const selfAddress = await this.signer.getAddress();
        return this.getUserBalance(selfAddress);
    }


    /**
     * Retrieves the current nonce for transfer and approve requests
     * @returns Current nonces for signer's address
     */
    private async getNonces(): Promise<CoinNonces> {
        const selfAddress = await this.signer.getAddress();

        try {
            const nonces = await this.contract.getNonces(selfAddress);
            return {transferNonce: nonces.transferNonce, approveNonce: nonces.approveNonce};
        } catch (error) {
            throw CoinError.from(error, this.contract);
        }
    }
}
