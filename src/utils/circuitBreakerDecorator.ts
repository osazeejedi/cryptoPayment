import { CircuitBreaker } from './circuitBreaker';

export function withCircuitBreaker(service: any, methodName: string, options = {
  failureThreshold: 3,
  resetTimeout: 30000
}) {
  const originalMethod = service[methodName];
  const circuitBreaker = new CircuitBreaker(
    service, 
    methodName,
    options.failureThreshold,
    options.resetTimeout
  );
  
  service[methodName] = async function(...args: any[]) {
    return circuitBreaker.execute(...args);
  };
  
  return service;
} 