import { Request, Response } from 'express';
export declare class SellController {
    /**
     * Verify a bank account
     */
    static verifyBankAccount(req: Request, res: Response): Promise<void>;
    /**
     * Get list of supported banks
     */
    static getBanks(req: Request, res: Response): Promise<void>;
    /**
     * Process a sell request
     */
    static sellRequest(req: Request, res: Response): Promise<void>;
    /**
     * Check the status of a sell transaction
     */
    static verifySellTransaction(req: Request, res: Response): Promise<void>;
}
