import express, { Router, Request, Response, NextFunction } from 'express';
import { BuyController } from '../controllers/buyController';
import { SellController } from '../controllers/sellController';
import { PriceController } from '../controllers/priceController';
import { BalanceController } from '../controllers/balanceController';
//import { PaymentController } from '../controllers/paymentController';
import { AuthController } from '../controllers/authController';
import { authenticateUser } from '../middleware/auth';
import { AuthenticatedRequest } from '../types/express';
import { TransferController } from '../controllers/transferController';
import axios from 'axios';

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
router.post('/buy', BuyController.initiatePurchase);

router.post('/sell', (req: Request, res: Response, next: NextFunction) => 
  SellController.processBankPayout(req, res).catch(next));
router.post('/send', TransferController.sendCrypto);
// Payment endpoints
// router.post('/payment/checkout', authenticateUser, (req: Request, res: Response, next: NextFunction) => 
//   PaymentController.initializeCheckout(req as AuthenticatedRequest, res).catch(next));
// router.get('/payment/banks', PaymentController.getBanks);
// router.get('/payment/verify/:reference', PaymentController.verifyPayment);
// router.post('/payment/webhook', (req: Request, res: Response, next: NextFunction) => 
//   PaymentController.handleWebhook(req, res).catch(next));
// router.get('/payment/success', PaymentController.handlePaymentSuccess);

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
// router.post('/buy/payment', (req: Request, res: Response, next: NextFunction) => 
//   BuyController.initiatePurchase(req, res).catch(next));
// Add these routes to your buyRoutes.ts
router.get('/success', BuyController.handlePaymentSuccess);
router.post('/transfer', BuyController.transferCrypto);
// Create payment for buying crypto
router.post('/', BuyController.initiatePurchase);


router.post('/webhook', BuyController.processPaymentWebhook);

// Test endpoint
router.get('/test', (req, res) => res.json({ message: 'API is working!' }));

// Add this route to your api.ts file
router.get('/server-ip', async (req, res) => {
  try {
    const response = await axios.get('https://api64.ipify.org?format=json');
    res.json({
      success: true,
      ip: response.data.ip,
      message: `Your Railway Server IP: ${response.data.ip}`
    });
  } catch (error) {
    console.error('Error fetching server IP:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching server IP'
    });
  }
});

export default router; 