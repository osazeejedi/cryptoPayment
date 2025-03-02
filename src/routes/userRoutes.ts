import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', UserController.registerUser);

// Protected routes
router.use('/:userId', authMiddleware);

// Get user profile
router.get('/:userId/profile', UserController.getUserProfile);

// Create a new wallet
router.post('/:userId/wallets', UserController.createWallet);

// Get user transactions
router.get('/:userId/transactions', UserController.getUserTransactions);

// Get wallet transactions
router.get('/:userId/wallets/:walletAddress/transactions', UserController.getWalletTransactions);

export default router; 