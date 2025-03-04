import { Request, Response } from 'express';
export declare class PaymentController {
    /**
     * Process a card payment
     */
    static processCardPayment(req: Request, res: Response): Promise<void>;
    /**
     * Process a bank transfer payment
     */
    static processBankTransfer(req: Request, res: Response): Promise<void>;
    /**
     * Get available banks
     */
    static getBanks(req: Request, res: Response): Promise<void>;
    /**
     * Verify a payment status
     */
    static verifyPayment(req: Request, res: Response): Promise<void>;
    /**
     * Handle Korapay webhook
     */
    static handleWebhook(req: Request, res: Response): Promise<void>;
    /**
     * Initialize a payment checkout page
     */
    static initializeCheckout(req: Request, res: Response): Promise<void>;
    /**
     * Handle payment success redirect
     */
    static handlePaymentSuccess(req: Request, res: Response): Promise<void>;
    /**
     * Process a mobile money payment
     */
    static processMobileMoneyPayment(req: Request, res: Response): Promise<void>;
    /**
     * Process a checkout payment
     */
    static processCheckout(req: Request, res: Response): Promise<void>;
    /**
     * Check payment status
     */
    static checkPaymentStatus(req: Request, res: Response): Promise<void>;
}
