import { BigNumberish } from "ethers";



export interface CollectionTransferRequest {
    from: string;
    to: string;
    tokenId: BigNumberish;
    nonce: number;
}



export const COLLECTION_TRANSFER_REQUEST_TYPE = {
    TransferRequest: [
        {name: "from", type: "address"},
        {name: "to", type: "address"},
        {name: "tokenId", type: "uint256"},
        {name: "nonce", type: "uint256"}
    ]
};