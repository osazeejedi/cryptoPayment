import { Router } from 'express';
import { TransferController } from '../controllers/transferController';

const router = Router();

// Send cryptocurrency
router.post('/send', TransferController.sendCrypto);

// Get wallet balance
router.get('/balance', TransferController.getBalance);

export default router; 