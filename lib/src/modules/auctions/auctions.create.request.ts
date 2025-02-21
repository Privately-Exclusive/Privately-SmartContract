import { BigNumberish } from "ethers";



export interface CreateAuctionRequest {
    seller: string;
    tokenId: BigNumberish;
    startPrice: BigNumberish;
    endTime: BigNumberish;
    nonce: BigNumberish;
}


export const AUCTIONS_CREATE_REQUEST_TYPE = {
    CreateAuctionRequest: [
        {name: "seller", type: "address"},
        {name: "tokenId", type: "uint256"},
        {name: "startPrice", type: "uint256"},
        {name: "endTime", type: "uint256"},
        {name: "nonce", type: "uint256"}
    ]
};