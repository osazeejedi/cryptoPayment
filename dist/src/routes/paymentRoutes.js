"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const paymentController_1 = require("../controllers/paymentController");
const router = (0, express_1.Router)();
// Process checkout payment
router.post('/checkout', paymentController_1.PaymentController.processCheckout);
// Check payment status
router.get('/status/:reference', paymentController_1.PaymentController.checkPaymentStatus);
// Webhook endpoint (disabled but kept for future use)
router.post('/webhook', paymentController_1.PaymentController.handleWebhook);
exports.default = router;
