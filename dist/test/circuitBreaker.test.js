"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const circuitBreaker_1 = require("../src/utils/circuitBreaker");
describe('CircuitBreaker', () => {
    const mockService = {
        successMethod: jest.fn().mockResolvedValue('success'),
        failureMethod: jest.fn().mockRejectedValue(new Error('Service error'))
    };
    beforeEach(() => {
        jest.clearAllMocks();
    });
    test('should successfully call the service method', async () => {
        const breaker = new circuitBreaker_1.CircuitBreaker(mockService, 'successMethod', 3, 1000);
        const result = await breaker.execute();
        expect(result).toBe('success');
        expect(mockService.successMethod).toHaveBeenCalledTimes(1);
        expect(breaker.getState()).toBe(circuitBreaker_1.CircuitState.CLOSED);
    });
    test('should open circuit after multiple failures', async () => {
        const breaker = new circuitBreaker_1.CircuitBreaker(mockService, 'failureMethod', 3, 1000);
        // First attempt
        await expect(breaker.execute()).rejects.toThrow('Service error');
        expect(breaker.getState()).toBe(circuitBreaker_1.CircuitState.CLOSED);
        // Second attempt
        await expect(breaker.execute()).rejects.toThrow('Service error');
        expect(breaker.getState()).toBe(circuitBreaker_1.CircuitState.CLOSED);
        // Third attempt - should open the circuit
        await expect(breaker.execute()).rejects.toThrow('Service error');
        expect(breaker.getState()).toBe(circuitBreaker_1.CircuitState.OPEN);
        // Next attempt should fail with circuit breaker error
        await expect(breaker.execute()).rejects.toThrow('Circuit breaker is open');
        expect(mockService.failureMethod).toHaveBeenCalledTimes(3);
    });
    test('should transition to half-open after reset timeout', async () => {
        jest.useFakeTimers();
        const breaker = new circuitBreaker_1.CircuitBreaker(mockService, 'failureMethod', 3, 1000);
        // Fail enough times to open the circuit
        for (let i = 0; i < 3; i++) {
            await expect(breaker.execute()).rejects.toThrow('Service error');
        }
        expect(breaker.getState()).toBe(circuitBreaker_1.CircuitState.OPEN);
        // Advance time past the reset timeout
        jest.advanceTimersByTime(1500);
        // Should be in half-open state
        try {
            await breaker.execute();
        }
        catch (e) {
            // Expected to throw
        }
        expect(breaker.getState()).toBe(circuitBreaker_1.CircuitState.OPEN);
        expect(mockService.failureMethod).toHaveBeenCalledTimes(4);
        jest.useRealTimers();
    });
});
//# sourceMappingURL=circuitBreaker.test.js.map