"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const buyController_1 = require("../controllers/buyController");
const sellController_1 = require("../controllers/sellController");
const priceController_1 = require("../controllers/priceController");
const balanceController_1 = require("../controllers/balanceController");
const paymentController_1 = require("../controllers/paymentController");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Transaction endpoints
router.post('/buy', auth_1.authenticateUser, (req, res, next) => buyController_1.BuyController.initiatePurchase(req, res).catch(next));
router.post('/sell', auth_1.authenticateUser, (req, res, next) => sellController_1.SellController.sellRequest(req, res).catch(next));
// Payment endpoints
router.post('/payment/checkout', auth_1.authenticateUser, (req, res, next) => paymentController_1.PaymentController.initializeCheckout(req, res).catch(next));
router.post('/payment/card', paymentController_1.PaymentController.processCardPayment);
router.post('/payment/bank-transfer', paymentController_1.PaymentController.processBankTransfer);
router.get('/payment/banks', paymentController_1.PaymentController.getBanks);
router.get('/payment/verify/:reference', paymentController_1.PaymentController.verifyPayment);
router.post('/payment/webhook', (req, res, next) => paymentController_1.PaymentController.handleWebhook(req, res).catch(next));
router.get('/payment/success', paymentController_1.PaymentController.handlePaymentSuccess);
// Information endpoints
router.get('/price', priceController_1.PriceController.getPrice);
router.get('/convert', priceController_1.PriceController.convertNairaToCrypto);
router.get('/balance', balanceController_1.BalanceController.getBalance);
// Auth routes
router.post('/auth/register', (req, res, next) => authController_1.AuthController.register(req, res).catch(next));
router.post('/auth/login', (req, res, next) => authController_1.AuthController.login(req, res).catch(next));
// Buy routes
router.get('/buy/:orderId', (req, res, next) => buyController_1.BuyController.getBuyOrderById(req, res).catch(next));
router.post('/buy/payment', (req, res, next) => buyController_1.BuyController.initiatePurchase(req, res).catch(next));
// Test endpoint
router.get('/test', (req, res) => res.json({ message: 'API is working!' }));
exports.default = router;
