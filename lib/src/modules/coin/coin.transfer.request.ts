import { TypedDataField } from "ethers";



export interface CoinTransferRequest {
    from: string;
    to: string;
    amount: bigint;
    nonce: bigint;
}



export const TRANSFER_REQUEST_TYPE: Record<string, TypedDataField[]> = {
    TransferRequest: [
        {name: "from", type: "address"},
        {name: "to", type: "address"},
        {name: "amount", type: "uint256"},
        {name: "nonce", type: "uint256"}
    ]
};
