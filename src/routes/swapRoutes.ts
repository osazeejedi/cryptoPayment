import { Router } from 'express';
import { SwapController } from '../controllers/swapController';

const router = Router();

// Swap cryptocurrency
router.post('/execute', SwapController.swapCrypto);

// Get swap estimate
router.get('/estimate', SwapController.getSwapEstimate);

export default router; 