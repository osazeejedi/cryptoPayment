"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitBreaker = exports.CircuitState = void 0;
var CircuitState;
(function (CircuitState) {
    CircuitState[CircuitState["CLOSED"] = 0] = "CLOSED";
    CircuitState[CircuitState["OPEN"] = 1] = "OPEN";
    CircuitState[CircuitState["HALF_OPEN"] = 2] = "HALF_OPEN"; // Testing if service is available again
})(CircuitState || (exports.CircuitState = CircuitState = {}));
class CircuitBreaker {
    constructor(service, method, failureThreshold = 3, resetTimeoutMs = 30000) {
        this.service = service;
        this.method = method;
        this.failureThreshold = failureThreshold;
        this.resetTimeoutMs = resetTimeoutMs;
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        this.lastFailureTime = 0;
        this.resetTimeout = resetTimeoutMs;
    }
    async execute(...args) {
        if (this.state === CircuitState.OPEN) {
            // Check if it's time to try again
            const now = Date.now();
            if (now - this.lastFailureTime > this.resetTimeout) {
                this.state = CircuitState.HALF_OPEN;
            }
            else {
                throw new Error(`Circuit breaker is open for ${this.method}`);
            }
        }
        try {
            const result = await this.service[this.method](...args);
            // If successful and in HALF_OPEN, reset to CLOSED
            if (this.state === CircuitState.HALF_OPEN) {
                this.reset();
            }
            return result;
        }
        catch (error) {
            this.recordFailure();
            throw error;
        }
    }
    recordFailure() {
        this.failureCount++;
        this.lastFailureTime = Date.now();
        if (this.state === CircuitState.HALF_OPEN || this.failureCount >= this.failureThreshold) {
            this.state = CircuitState.OPEN;
        }
    }
    reset() {
        this.failureCount = 0;
        this.state = CircuitState.CLOSED;
    }
    getState() {
        return this.state;
    }
}
exports.CircuitBreaker = CircuitBreaker;
