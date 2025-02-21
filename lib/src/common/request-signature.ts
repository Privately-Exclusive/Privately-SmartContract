export class RequestSignature<T> {
    public readonly signature: string;
    public readonly request: T;


    constructor(signature: string, request: T) {
        this.signature = signature;
        this.request = request;
    }
}