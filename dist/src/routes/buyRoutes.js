"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const buyController_1 = require("../controllers/buyController");
const router = (0, express_1.Router)();
// Create payment for buying crypto
router.post('/', buyController_1.BuyController.initiatePurchase);
router.post('/webhook', buyController_1.BuyController.processPaymentWebhook);
// Add these routes to your buyRoutes.ts
router.get('/success', buyController_1.BuyController.handlePaymentSuccess);
router.post('/transfer', buyController_1.BuyController.transferCrypto);
// Add a test route
router.get('/test-success', (req, res) => {
    res.send('Success route is working!');
});
exports.default = router;
