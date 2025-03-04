import { Request, Response } from 'express';
export declare class TransferController {
    /**
     * Send cryptocurrency to a specified address
     */
    static sendCrypto(req: Request, res: Response): Promise<void>;
    /**
     * Get the balance of a wallet
     */
    static getBalance(req: Request, res: Response): Promise<void>;
}
