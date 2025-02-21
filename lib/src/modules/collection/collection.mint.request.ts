import { TypedDataField } from "ethers";



export interface CollectionMintRequest {
    user: string;
    title: string;
    author: string;
    tokenURI: string;
    nonce: number;
}



export const COLLECTION_MINT_REQUEST_TYPE: Record<string, TypedDataField[]> = {
    MintRequest: [
        {name: "user", type: "address"},
        {name: "title", type: "string"},
        {name: "author", type: "address"},
        {name: "tokenURI", type: "string"},
        {name: "nonce", type: "uint256"}
    ]
};