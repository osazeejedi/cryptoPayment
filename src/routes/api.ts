import express from 'express';
import { BuyController } from '../controllers/buyController';
import { SellController } from '../controllers/sellController';
import { PriceController } from '../controllers/priceController';

const router = express.Router();

// Transaction endpoints
router.post('/buy', BuyController.buyRequest);
router.post('/sell', SellController.sellRequest);

// Price endpoint
router.get('/price', PriceController.getPrice);

export default router; 