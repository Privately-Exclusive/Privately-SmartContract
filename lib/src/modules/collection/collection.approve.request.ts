import { BigNumberish, TypedDataField } from "ethers";



export interface CollectionApproveRequest {
    owner: string;
    spender: string;
    tokenId: BigNumberish;
    nonce: number;
}


export const COLLECTION_APPROVE_REQUEST_TYPE: Record<string, TypedDataField[]> = {
    ApproveRequest: [
        {name: "owner", type: "address"},
        {name: "spender", type: "address"},
        {name: "tokenId", type: "uint256"},
        {name: "nonce", type: "uint256"}
    ]
};