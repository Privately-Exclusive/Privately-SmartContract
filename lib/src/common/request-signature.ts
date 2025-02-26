export enum RequestType {
    // Auctions requests types
    AUCTION_CREATE = "AUCTION_CREATE",
    AUCTION_BID = "AUCTION_BID",

    // Coin requests types
    COIN_TRANSFER = "COIN_TRANSFER",
    COIN_APPROVE = "COIN_APPROVE",

    // Collection requests types
    COLLECTION_MINT = "COLLECTION_MINT",
    COLLECTION_TRANSFER = "COLLECTION_TRANSFER",
    COLLECTION_APPROVE = "COLLECTION_APPROVE",
}



export class RequestSignature<T> {
    public readonly type: RequestType;
    public readonly signature: string;
    public readonly request: T;


    constructor(type: RequestType, signature: string, request: T) {
        this.type = type;
        this.signature = signature;
        this.request = request;
    }
}