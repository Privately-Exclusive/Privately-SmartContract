import { Log } from "ethers";



export type OnMintListener = (
    to: string,
    amount: bigint,
    finalBalance: bigint,
    event: Log
) => void;



export type OnTransferListener = (
    from: string,
    to: string,
    amount: bigint,
    fromFinalBalance: bigint,
    toFinalBalance: bigint,
    event: Log
) => void;
