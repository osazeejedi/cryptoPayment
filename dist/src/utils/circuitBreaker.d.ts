export declare enum CircuitState {
    CLOSED = 0,// Normal operation
    OPEN = 1,// Service unavailable
    HALF_OPEN = 2
}
export declare class CircuitBreaker {
    private service;
    private method;
    private failureThreshold;
    private resetTimeoutMs;
    private state;
    private failureCount;
    private lastFailureTime;
    private resetTimeout;
    constructor(service: any, method: string, failureThreshold?: number, resetTimeoutMs?: number);
    execute(...args: any[]): Promise<any>;
    private recordFailure;
    private reset;
    getState(): CircuitState;
}
