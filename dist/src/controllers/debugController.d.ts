import { Request, Response } from 'express';
export declare class DebugController {
    static logRequest(req: Request, res: Response): Promise<void>;
}
