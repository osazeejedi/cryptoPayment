export declare class ServiceError extends Error {
    constructor(message: string);
}
export declare class BlockchainError extends ServiceError {
    readonly code?: string | undefined;
    constructor(message: string, code?: string | undefined);
}
export declare class DatabaseError extends ServiceError {
    constructor(message: string);
}
export declare class PriceServiceError extends ServiceError {
    constructor(message: string);
}
export declare class PaymentServiceError extends ServiceError {
    constructor(message: string);
}
export declare function handleServiceError(error: unknown, service: string): ServiceError;
