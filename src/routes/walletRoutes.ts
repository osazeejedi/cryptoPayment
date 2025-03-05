import express from 'express';
import { WalletController } from '../controllers/walletController';
import { authenticateUser } from '../middleware/auth';

const router = express.Router();

// Get user wallet
router.get('/', authenticateUser, WalletController.getUserWallet);

// Get wallet balance
router.get('/balance/:address', authenticateUser, WalletController.getWalletBalance);

export default router; 