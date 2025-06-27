export class Auction {
    id: bigint; // Auction ID
    seller: string; // Seller's address
    tokenId: bigint; // Token ID being auctioned
    startPrice: bigint; // Starting price of the auction
    highestBid: bigint; // Highest bid placed in the auction
    highestBidder: string; // Address of the highest bidder
    endTime: bigint; // End time of the auction (timestamp)
    settled: boolean; // Indicates if the auction has been settled


    constructor(
        id: bigint,
        seller: string,
        tokenId: bigint,
        startPrice: bigint,
        highestBid: bigint,
        highestBidder: string,
        endTime: bigint,
        settled: boolean
    ) {
        this.id = id;
        this.seller = seller;
        this.tokenId = tokenId;
        this.startPrice = startPrice;
        this.highestBid = highestBid;
        this.highestBidder = highestBidder;
        this.endTime = endTime;
        this.settled = settled;
    }



    public static async map(list: bigint[], client: any): Promise<Auction[]> {
        return await Promise.all(list.map(async (id: bigint) => {
            return await client.getAuction(id);
        }));
    }
}
