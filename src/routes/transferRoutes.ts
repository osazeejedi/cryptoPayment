import { Router } from 'express';
import { TransferController } from '../controllers/transferController';
import { authenticateUser } from '../middleware/auth';

const router = Router();

// Transfer crypto
router.post('/', authenticateUser, TransferController.sendCrypto);

// Get transfer fee estimate
router.get('/fee', TransferController.getTransferFee);

export default router; 