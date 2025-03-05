import { Request } from 'express';

// Extend the Express Request interface
declare namespace Express {
  export interface Request {
    user?: {
      id: string;
      email: string;
      role?: string;
    };
  }
}

// For specific request types
export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role?: string;
  };
} 