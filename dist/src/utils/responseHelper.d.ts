import { Response } from 'express';
export declare const sendSuccess: (res: Response, data: any, message?: string) => Response<any, Record<string, any>>;
export declare const sendError: (res: Response, message: string, status?: number) => Response<any, Record<string, any>>;
