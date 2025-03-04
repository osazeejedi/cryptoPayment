export declare function withCircuitBreaker(service: any, methodName: string, options?: {
    failureThreshold: number;
    resetTimeout: number;
}): any;
