export class Auction {
    id: bigint;
    seller: string;
    tokenId: bigint;
    startPrice: bigint;
    highestBid: bigint;
    highestBidder: string;
    endTime: bigint;
    settled: boolean;


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
