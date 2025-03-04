// Define custom error types for better error handling
export class ServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ServiceError';
  }
}

export class BlockchainError extends ServiceError {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'BlockchainError';
  }
}

export class DatabaseError extends ServiceError {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class PriceServiceError extends ServiceError {
  constructor(message: string) {
    super(message);
    this.name = 'PriceServiceError';
  }
}

export class PaymentServiceError extends ServiceError {
  constructor(message: string) {
    super(message);
    this.name = 'PaymentServiceError';
  }
}

// Error handler function specific to each service
export function handleServiceError(error: unknown, service: string): ServiceError {
  if (error instanceof ServiceError) {
    return error;
  }
  
  const message = error instanceof Error ? error.message : 'Unknown error occurred';
  console.error(`[${service}] Error:`, error);
  
  switch (service) {
    case 'blockchain':
      return new BlockchainError(`Blockchain operation failed: ${message}`);
    case 'database':
      return new DatabaseError(`Database operation failed: ${message}`);
    case 'price':
      return new PriceServiceError(`Price service failed: ${message}`);
    case 'payment':
      return new PaymentServiceError(`Payment operation failed: ${message}`);
    default:
      return new ServiceError(`Service operation failed: ${message}`);
  }
} 