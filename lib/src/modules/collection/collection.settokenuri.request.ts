import { TypedDataField } from "ethers";



export interface CollectionSetTokenURIRequest {
    owner: string;
    tokenId: bigint;
    tokenURI: string;
    nonce: bigint;
}


export const COLLECTION_SET_TOKEN_URI_REQUEST_TYPE: Record<string, TypedDataField[]> = {
    SetTokenURIRequest: [
        {name: "owner", type: "address"},
        {name: "tokenId", type: "uint256"},
        {name: "tokenURI", type: "string"},
        {name: "nonce", type: "uint256"}
    ]
};
