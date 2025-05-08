import { Log } from "ethers/lib.esm";



export type OnCreateListener = (
    auctionId: bigint,
    seller: string,
    tokenId: bigint,
    startPrice: bigint,
    endTime: bigint,
    event: Log
) => void;


export type OnBidListener = (
    auctionId: bigint,
    bidder: string,
    bidAmount: bigint,
    event: Log
) => void;


export type OnEnd = (
    auctionId: bigint,
    tokenId: bigint,
    highestBidder: string,
    highestBid: bigint,
    event: Log
) => void;


export type OnWithdrawListener = (
    user: string,
    amount: bigint,
    event: Log
) => void;