import { Router } from 'express';
import { BuyController } from '../controllers/buyController';
import { authenticateUser } from '../middleware/auth';

const router = Router();

// Create payment for buying crypto
router.post('/', BuyController.initiatePurchase);

// Webhook endpoint - no verification for now
router.post('/webhook', BuyController.processPaymentWebhook);

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

router.get('/success', BuyController.handlePaymentSuccess);
router.post('/transfer', BuyController.transferCrypto);

// Create virtual account for payment
router.post('/virtual-account', authenticateUser, BuyController.createVirtualAccount);

// // Add a test route at root level
// router.get('/test', (req: Request, res: Response) => {
//   res.status(200).json({
//     status: 'success',
//     message: 'Buy routes are working',
//     timestamp: new Date().toISOString()
//   });
// });

// Add route for manual crypto transfer
router.post('/manual-transfer', BuyController.manualCryptoTransfer);

// Payment notification endpoints
router.get('/payments/recent', BuyController.getRecentPayments);
router.get('/payments/poll', BuyController.pollPayments);
router.get('/payments/:reference', BuyController.getPaymentByReference);

export default router;