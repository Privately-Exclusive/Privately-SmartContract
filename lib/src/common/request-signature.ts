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


    public static deserialize<T>(json: string): RequestSignature<T> {
        const parsed = JSON.parse(json, (key, value) => {
            if (typeof value === "string" && value.endsWith("n")) {
                const numStr = value.slice(0, -1);
                // Only convert to BigInt if the string (without 'n') is a valid integer
                if (/^-?\d+$/.test(numStr)) {
                    return BigInt(numStr);
                }
            }
            return value;
        });
        return new RequestSignature<T>(parsed.type, parsed.signature, parsed.request);
    }


    public serialize(): string {
        return JSON.stringify(this, (key, value) =>
            typeof value === "bigint" ? value.toString() + "n" : value);
    }
}