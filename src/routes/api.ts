import express from 'express';
import { BuyController } from '../controllers/buyController';
import { SellController } from '../controllers/sellController';
import { PriceController } from '../controllers/priceController';
import { BalanceController } from '../controllers/balanceController';
import { PaymentController } from '../controllers/paymentController';

const router = express.Router();

// Transaction endpoints
router.post('/buy', BuyController.buyRequest);
router.post('/sell', SellController.sellRequest);

// Payment endpoints
router.post('/payment/checkout', PaymentController.initializeCheckout);
router.post('/payment/card', PaymentController.processCardPayment);
router.post('/payment/bank-transfer', PaymentController.processBankTransfer);
router.get('/payment/banks', PaymentController.getBanks);
router.get('/payment/verify/:reference', PaymentController.verifyPayment);
router.post('/payment/webhook', PaymentController.handleWebhook);
router.get('/payment/success', PaymentController.handlePaymentSuccess);

// Information endpoints
router.get('/price', PriceController.getPrice);
router.get('/convert', PriceController.convertNairaToCrypto);
router.get('/balance', BalanceController.getBalance);

// Test endpoint
router.get('/test', (req, res) => res.json({ message: 'API is working!' }));

export default router; 