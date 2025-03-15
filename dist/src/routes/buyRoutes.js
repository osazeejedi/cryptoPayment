"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const buyController_1 = require("../controllers/buyController");
const router = (0, express_1.Router)();
// Create payment for buying crypto
router.post('/', buyController_1.BuyController.initiatePurchase);
// Webhook endpoint - no verification for now
router.post('/webhook', buyController_1.BuyController.processPaymentWebhook);
// Add test endpoint without authentication
// router.get('/webhook/test', (req: Request, res: Response) => {
//   res.status(200).json({
//     status: 'success',
//     message: 'Webhook endpoint is accessible',
//     path: req.path,
//     method: req.method,
//     timestamp: new Date().toISOString()
//   });
// });
router.get('/success', buyController_1.BuyController.handlePaymentSuccess);
router.post('/transfer', buyController_1.BuyController.transferCrypto);
// Create virtual account for payment
router.post('/virtual-account', buyController_1.BuyController.createVirtualAccount);
// // Add a test route at root level
// router.get('/test', (req: Request, res: Response) => {
//   res.status(200).json({
//     status: 'success',
//     message: 'Buy routes are working',
//     timestamp: new Date().toISOString()
//   });
// });
// Add route for manual crypto transfer
router.post('/manual-transfer', buyController_1.BuyController.manualCryptoTransfer);
// Payment notification endpoints
router.get('/payments/recent', buyController_1.BuyController.getRecentPayments);
router.get('/payments/poll', buyController_1.BuyController.pollPayments);
router.get('/payments/:reference', buyController_1.BuyController.getPaymentByReference);
exports.default = router;
