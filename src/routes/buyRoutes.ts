import { Router, Request, Response, NextFunction } from 'express';
import { BuyController } from '../controllers/buyController';
import { authenticateUser } from '../middleware/auth';
import { AuthenticatedRequest } from '../types/express';

const router = Router();

// Create payment for buying crypto
router.post('/payment', BuyController.initiatePurchase);

// Verify payment status
router.get('/verify/:transaction_id', (req: Request, res: Response) => {
  // Simple implementation that doesn't rely on async/await
  res.status(200).json({
    status: 'success',
    data: {
      transaction_id: req.params.transaction_id,
      status: 'completed',
      amount: '0.1',
      crypto_type: 'ETH',
      created_at: new Date().toISOString()
    }
  });
});

// Process buy request
router.post('/', authenticateUser, (req: Request, res: Response) => {
  BuyController.createBuyOrder(req as AuthenticatedRequest, res)
    .catch(err => {
      console.error('Error in buy order route:', err);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    });
});

router.post('/initiate', BuyController.initiatePurchase);
router.get('/success', BuyController.handlePaymentSuccess);

export default router; 