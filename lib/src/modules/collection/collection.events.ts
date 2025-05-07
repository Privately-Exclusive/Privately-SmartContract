import { Log } from "ethers";



export type OnMintListener = (
    to: string,
    amount: bigint,
    event: Log
) => void;



export type OnTransferListener = (
    from: string,
    to: string,
    amount: bigint,
    event: Log
) => void;
