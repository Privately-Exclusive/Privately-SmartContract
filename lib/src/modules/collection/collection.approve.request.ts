import { TypedDataField } from "ethers";



export interface CollectionApproveRequest {
    owner: string;
    spender: string;
    tokenId: bigint;
    nonce: bigint;
}


export const COLLECTION_APPROVE_REQUEST_TYPE: Record<string, TypedDataField[]> = {
    ApproveRequest: [
        {name: "owner", type: "address"},
        {name: "spender", type: "address"},
        {name: "tokenId", type: "uint256"},
        {name: "nonce", type: "uint256"}
    ]
};