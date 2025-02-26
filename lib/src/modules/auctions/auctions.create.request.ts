export interface CreateAuctionRequest {
    seller: string;
    tokenId: bigint;
    startPrice: bigint;
    endTime: bigint;
    nonce: bigint;
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