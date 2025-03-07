"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const buyController_1 = require("../controllers/buyController");
const sellController_1 = require("../controllers/sellController");
const priceController_1 = require("../controllers/priceController");
const balanceController_1 = require("../controllers/balanceController");
//import { PaymentController } from '../controllers/paymentController';
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
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
router.post('/buy', buyController_1.BuyController.initiatePurchase);
router.post('/sell', auth_1.authenticateUser, (req, res, next) => sellController_1.SellController.sellRequest(req, res).catch(next));
// Payment endpoints
// router.post('/payment/checkout', authenticateUser, (req: Request, res: Response, next: NextFunction) => 
//   PaymentController.initializeCheckout(req as AuthenticatedRequest, res).catch(next));
// router.get('/payment/banks', PaymentController.getBanks);
// router.get('/payment/verify/:reference', PaymentController.verifyPayment);
// router.post('/payment/webhook', (req: Request, res: Response, next: NextFunction) => 
//   PaymentController.handleWebhook(req, res).catch(next));
// router.get('/payment/success', PaymentController.handlePaymentSuccess);
// Information endpoints
router.get('/price', priceController_1.PriceController.getPrice);
router.get('/convert', priceController_1.PriceController.convertNairaToCrypto);
router.get('/balance', balanceController_1.BalanceController.getBalance);
// Auth routes
router.post('/auth/register', (req, res, next) => authController_1.AuthController.register(req, res).catch(next));
router.post('/auth/login', (req, res, next) => authController_1.AuthController.login(req, res).catch(next));
// Buy routes
// router.post('/buy/payment', (req: Request, res: Response, next: NextFunction) => 
//   BuyController.initiatePurchase(req, res).catch(next));
// Add these routes to your buyRoutes.ts
router.get('/success', buyController_1.BuyController.handlePaymentSuccess);
router.post('/transfer', buyController_1.BuyController.transferCrypto);
// Create payment for buying crypto
router.post('/', buyController_1.BuyController.initiatePurchase);
router.post('/webhook', buyController_1.BuyController.processPaymentWebhook);
// Test endpoint
router.get('/test', (req, res) => res.json({ message: 'API is working!' }));
exports.default = router;
