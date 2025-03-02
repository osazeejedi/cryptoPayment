import express from 'express';
import { WalletController } from '../controllers/walletController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Get user wallet
router.get('/', authenticate, WalletController.getUserWallet);

// Get wallet balance
router.get('/balance/:address', authenticate, WalletController.getWalletBalance);

export default router; 