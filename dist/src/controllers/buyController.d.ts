import { Request, Response } from 'express';
export declare class BuyController {
    static buyRequest(req: Request, res: Response): Promise<void>;
    /**
     * Process a buy request programmatically (for internal use)
     * @param buyData The buy request data
     * @returns Transaction hash
     */
    static processBuyRequest(buyData: {
        user_id: string;
        amount: string;
        crypto_type: string;
        wallet_address: string;
        payment_reference?: string;
    }): Promise<string>;
    /**
     * Verify payment status
     */
    static verifyPayment(req: Request, res: Response): Promise<void>;
    /**
     * Process crypto transfer for a successful payment
     * @param transaction Transaction object
     */
    private static processCryptoTransfer;
    /**
     * Initiate a crypto purchase
     */
    static initiatePurchase(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Process webhook from payment provider
     */
    static processWebhook(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Check transaction status
     */
    static checkTransactionStatus(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
