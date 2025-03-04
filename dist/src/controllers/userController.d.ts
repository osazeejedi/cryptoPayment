import { Request, Response } from 'express';
export declare class UserController {
    /**
     * Get user profile
     */
    static getUserProfile(req: Request, res: Response): Promise<void>;
    /**
     * Create a new wallet for a user
     */
    static createWallet(req: Request, res: Response): Promise<void>;
    /**
     * Get user transactions
     */
    static getUserTransactions(req: Request, res: Response): Promise<void>;
    /**
     * Get wallet transactions
     */
    static getWalletTransactions(req: Request, res: Response): Promise<void>;
    /**
     * Register a new user with wallet
     */
    static registerUser(req: Request, res: Response): Promise<void>;
}
