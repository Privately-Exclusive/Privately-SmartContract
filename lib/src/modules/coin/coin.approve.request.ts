import { TypedDataField } from "ethers";


export interface CoinApproveRequest {
    owner: string;
    spender: string;
    amount: bigint;
    nonce: bigint;
}


export const APPROVE_REQUEST_TYPE: Record<string, TypedDataField[]> = {
    ApproveRequest: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
        { name: "amount", type: "uint256" },
        { name: "nonce", type: "uint256" }
    ]
};
