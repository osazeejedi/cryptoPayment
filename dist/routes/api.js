"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const buyController_1 = require("../controllers/buyController");
const sellController_1 = require("../controllers/sellController");
const priceController_1 = require("../controllers/priceController");
const balanceController_1 = require("../controllers/balanceController");
const paymentController_1 = require("../controllers/paymentController");
const router = express_1.default.Router();
// Transaction endpoints
router.post('/buy', buyController_1.BuyController.buyRequest);
router.post('/sell', sellController_1.SellController.sellRequest);
// Payment endpoints
router.post('/payment/checkout', paymentController_1.PaymentController.initializeCheckout);
router.post('/payment/card', paymentController_1.PaymentController.processCardPayment);
router.post('/payment/bank-transfer', paymentController_1.PaymentController.processBankTransfer);
router.get('/payment/banks', paymentController_1.PaymentController.getBanks);
router.get('/payment/verify/:reference', paymentController_1.PaymentController.verifyPayment);
router.post('/payment/webhook', paymentController_1.PaymentController.handleWebhook);
router.get('/payment/success', paymentController_1.PaymentController.handlePaymentSuccess);
// Information endpoints
router.get('/price', priceController_1.PriceController.getPrice);
router.get('/convert', priceController_1.PriceController.convertNairaToCrypto);
router.get('/balance', balanceController_1.BalanceController.getBalance);
// Test endpoint
router.get('/test', (req, res) => res.json({ message: 'API is working!' }));
exports.default = router;
