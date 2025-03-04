import { Request, Response } from 'express';
export declare class SwapController {
    /**
     * Swap one cryptocurrency for another
     */
    static swapCrypto(req: Request, res: Response): Promise<void>;
    /**
     * Get estimated swap output amount
     */
    static getSwapEstimate(req: Request, res: Response): Promise<void>;
}
