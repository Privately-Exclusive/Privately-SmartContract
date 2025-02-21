import { Contract } from "ethers";
import { parseContractError, PrivatelyError } from "../../common/privately.error";



export class CollectionError extends PrivatelyError {
    constructor(message: string) {
        super(`CollectionError: ${message}`);
        this.name = "CollectionError";
    }


    static from(error: any, contract?: Contract): CollectionError {
        return new CollectionError(
            parseContractError(
                error,
                contract?.interface
            )
        );
    }
}