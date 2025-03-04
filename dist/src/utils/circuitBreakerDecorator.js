"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withCircuitBreaker = withCircuitBreaker;
const circuitBreaker_1 = require("./circuitBreaker");
function withCircuitBreaker(service, methodName, options = {
    failureThreshold: 3,
    resetTimeout: 30000
}) {
    const originalMethod = service[methodName];
    const circuitBreaker = new circuitBreaker_1.CircuitBreaker(service, methodName, options.failureThreshold, options.resetTimeout);
    service[methodName] = async function (...args) {
        return circuitBreaker.execute(...args);
    };
    return service;
}
