export enum CircuitState {
  CLOSED,   // Normal operation
  OPEN,     // Service unavailable
  HALF_OPEN // Testing if service is available again
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private resetTimeout: number;
  
  constructor(
    private service: any,
    private method: string,
    private failureThreshold: number = 3,
    private resetTimeoutMs: number = 30000
  ) {
    this.resetTimeout = resetTimeoutMs;
  }
  
  async execute(...args: any[]): Promise<any> {
    if (this.state === CircuitState.OPEN) {
      // Check if it's time to try again
      const now = Date.now();
      if (now - this.lastFailureTime > this.resetTimeout) {
        this.state = CircuitState.HALF_OPEN;
      } else {
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
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }
  
  private recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.state === CircuitState.HALF_OPEN || this.failureCount >= this.failureThreshold) {
      this.state = CircuitState.OPEN;
    }
  }
  
  private reset(): void {
    this.failureCount = 0;
    this.state = CircuitState.CLOSED;
  }
  
  getState(): CircuitState {
    return this.state;
  }
} 