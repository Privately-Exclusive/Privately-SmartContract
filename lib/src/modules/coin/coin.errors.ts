import { Contract } from "ethers";
import { parseContractError, PrivatelyError } from "../../common/privately.error";



export class CoinError extends PrivatelyError {
    constructor(message: string | object) {
        super(`CoinError: ${typeof message === 'object' ? JSON.stringify(message) : message}`);
        this.name = "CoinError";
    }

    static from(error: any, contract?: Contract): CoinError {
        try {
            const message = parseContractError(error, contract?.interface);
            return new CoinError(message);
        } catch (parseError) {
            return new CoinError({
                originalError: error,
                parseError
            });
        }
    }
}