import { Request, Response } from 'express';
export declare class WalletController {
    /**
     * Get user wallet
     */
    static getUserWallet(req: Request & {
        user?: {
            id: string;
        };
    }, res: Response): Promise<void>;
    /**
     * Get wallet balance
     */
    static getWalletBalance(req: Request, res: Response): Promise<void>;
}
