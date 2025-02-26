export interface BidAuctionRequest {
    bidder: string;
    auctionId: bigint;
    bidAmount: bigint;
    nonce: bigint;
}



export const AUCTIONS_BID_REQUEST_TYPE = {
    BidRequest: [
        {name: "bidder", type: "address"},
        {name: "auctionId", type: "uint256"},
        {name: "bidAmount", type: "uint256"},
        {name: "nonce", type: "uint256"}
    ]
};