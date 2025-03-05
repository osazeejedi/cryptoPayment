import { Router, Request, Response, NextFunction } from 'express';
import { TransactionController } from '../controllers/transactionController';
import { authenticateUser } from '../middleware/auth';
import { AuthenticatedRequest } from '../types/express';

const router = Router();

// Get user transactions
router.get('/', authenticateUser, (req: Request, res: Response, next: NextFunction) => 
  TransactionController.getUserTransactions(req as AuthenticatedRequest, res).catch(next));

// Get transaction details
router.get('/:id', authenticateUser, (req: Request, res: Response, next: NextFunction) => 
  TransactionController.getTransactionDetails(req as AuthenticatedRequest, res).catch(next));

export default router; 