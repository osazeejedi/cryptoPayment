import { Router, Request, Response, NextFunction } from 'express';
import { BuyController } from '../controllers/buyController';
import { authenticateUser } from '../middleware/auth';
import { AuthenticatedRequest } from '../types/express';

const router = Router();

// Create payment for buying crypto
router.post('/payment', BuyController.initiatePurchase);


router.post('/webhook', BuyController.processPaymentWebhook);

export default router; 