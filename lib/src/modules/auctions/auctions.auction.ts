import { BigNumberish } from "ethers";



export class Auction {
    id: BigNumberish;
    seller: string;
    tokenId: BigNumberish;
    startPrice: BigNumberish;
    highestBid: BigNumberish;
    highestBidder: string;
    endTime: BigNumberish;
    settled: boolean;


    constructor(
        id: BigNumberish,
        seller: string,
        tokenId: BigNumberish,
        startPrice: BigNumberish,
        highestBid: BigNumberish,
        highestBidder: string,
        endTime: BigNumberish,
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



    public static async map(list: BigNumberish[], client: any): Promise<Auction[]> {
        return await Promise.all(list.map(async (id: BigNumberish) => {
            return await client.getAuction(id);
        }));
    }
}
