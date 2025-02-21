import { Interface } from "ethers";



export class PrivatelyError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "PrivatelyError";
    }
}



export function parseContractError(error: unknown, contractInterface?: Interface): string {
    const getNestedErrorData = (err: any): any => {
        if (typeof err?.data === "string") return err.data;
        if (err?.error) return getNestedErrorData(err.error);
        if (err?.data?.data) return err.data.data;
        return err?.data || err?.message || err;
    };

    try {
        const errorData = getNestedErrorData(error);

        if (errorData && contractInterface) {
            const formattedData = typeof errorData === "string" && errorData.startsWith("0x")
                ? errorData
                : null;

            if (formattedData) {
                const parsed = contractInterface.parseError(formattedData);
                if (parsed) {
                    return `${parsed.name}${parsed.args.length ? `: ${parsed.args.join(", ")}` : ""}`;
                }
            }
        }

        const message = (error instanceof Error)
            ? error.message
            : JSON.stringify(error, Object.getOwnPropertyNames(error));

        const match = message.match(/(?:"message":"|execution reverted:?)(.*?)(?:"|$)/);
        return match?.[1] || message;

    } catch (parseError) {
        return JSON.stringify({
            originalError: error,
            parseError
        }, null, 2);
    }
}