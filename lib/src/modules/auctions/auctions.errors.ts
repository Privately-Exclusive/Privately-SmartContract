import { Contract } from "ethers";
import { parseContractError, PrivatelyError } from "../../common/privately.error";



export class AuctionSystemError extends PrivatelyError {
    constructor(message: string) {
        super(`AuctionSystemError: ${message}`);
        this.name = "AuctionSystemError";
    }


    static from(error: any, contract?: Contract): AuctionSystemError {
        return new AuctionSystemError(
            parseContractError(
                error,
                contract?.interface
            )
        );
    }
}