import { Request, Response } from 'express';
export declare class AuthController {
    /**
     * Register a new user
     */
    static register(req: Request, res: Response): Promise<void>;
    /**
     * Login user
     */
    static login(req: Request, res: Response): Promise<void>;
}
