import express, { Router, Request, Response, NextFunction } from 'express';
import { BuyController } from '../controllers/buyController';
import { SellController } from '../controllers/sellController';
import { PriceController } from '../controllers/priceController';
import { BalanceController } from '../controllers/balanceController';
import { PaymentController } from '../controllers/paymentController';
import { AuthController } from '../controllers/authController';
import { authenticateUser } from '../middleware/auth';
import { AuthenticatedRequest } from '../types/express';

const router = Router();

/**
 * @swagger
 * /api/buy:
 *   post:
 *     summary: Create a new buy order
 *     tags: [Buy]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - cryptoType
 *               - walletAddress
 *             properties:
 *               amount:
 *                 type: string
 *                 description: Amount in Naira
 *               cryptoType:
 *                 type: string
 *                 description: Type of cryptocurrency (ETH, BTC)
 *               walletAddress:
 *                 type: string
 *                 description: Wallet address to receive crypto
 *     responses:
 *       200:
 *         description: Buy order created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/buy', authenticateUser, (req: Request, res: Response, next: NextFunction) => 
  BuyController.initiatePurchase(req as AuthenticatedRequest, res).catch(next));
router.post('/sell', authenticateUser, (req: Request, res: Response, next: NextFunction) => 
  SellController.sellRequest(req as AuthenticatedRequest, res).catch(next));

// Payment endpoints
router.post('/payment/checkout', authenticateUser, (req: Request, res: Response, next: NextFunction) => 
  PaymentController.initializeCheckout(req as AuthenticatedRequest, res).catch(next));
router.post('/payment/card', PaymentController.processCardPayment);
router.post('/payment/bank-transfer', PaymentController.processBankTransfer);
router.get('/payment/banks', PaymentController.getBanks);
router.get('/payment/verify/:reference', PaymentController.verifyPayment);
router.post('/payment/webhook', (req: Request, res: Response, next: NextFunction) => 
  PaymentController.handleWebhook(req, res).catch(next));
router.get('/payment/success', PaymentController.handlePaymentSuccess);

// Information endpoints
router.get('/price', PriceController.getPrice);
router.get('/convert', PriceController.convertNairaToCrypto);
router.get('/balance', BalanceController.getBalance);

// Auth routes
router.post('/auth/register', (req: Request, res: Response, next: NextFunction) => 
  AuthController.register(req, res).catch(next));
router.post('/auth/login', (req: Request, res: Response, next: NextFunction) => 
  AuthController.login(req, res).catch(next));

// Buy routes
router.get('/buy/:orderId', (req: Request, res: Response, next: NextFunction) => 
  BuyController.getBuyOrderById(req, res).catch(next));
router.post('/buy/payment', (req: Request, res: Response, next: NextFunction) => 
  BuyController.initiatePurchase(req, res).catch(next));

// Test endpoint
router.get('/test', (req, res) => res.json({ message: 'API is working!' }));

export default router; 