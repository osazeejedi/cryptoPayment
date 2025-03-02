import { Router } from 'express';
import { PaymentController } from '../controllers/paymentController';

const router = Router();

// Process checkout payment
router.post('/checkout', PaymentController.processCheckout);

// Check payment status
router.get('/status/:reference', PaymentController.checkPaymentStatus);

// Webhook endpoint (disabled but kept for future use)
router.post('/webhook', PaymentController.handleWebhook);

export default router; 