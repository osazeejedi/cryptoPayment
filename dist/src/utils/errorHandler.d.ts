import { Request, Response, NextFunction } from 'express';
export declare class AppError extends Error {
    statusCode: number;
    status: string;
    isOperational: boolean;
    constructor(message: string, statusCode: number);
}
export declare const errorHandler: (err: Error, req: Request, res: Response, next: NextFunction) => void;
export declare const handleError: (error: unknown, res: Response, defaultMessage?: string) => Response;
export declare const handleControllerError: (error: unknown, res: Response, defaultMessage?: string) => Response;
