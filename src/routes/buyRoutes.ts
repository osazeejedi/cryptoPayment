import { Router, Request, Response, NextFunction } from 'express';
import { BuyController } from '../controllers/buyController';
import { authenticateUser } from '../middleware/auth';
import { AuthenticatedRequest } from '../types/express';

const router = Router();

// Create payment for buying crypto
router.post('/', BuyController.initiatePurchase);


router.post('/webhook', BuyController.processPaymentWebhook);

// Add these routes to your buyRoutes.ts
router.get('/success', BuyController.handlePaymentSuccess);
router.post('/transfer', BuyController.transferCrypto);

// Add a test route
router.get('/test-success', (req: Request, res: Response) => {
  res.send('Success route is working!');
});

export default router; 