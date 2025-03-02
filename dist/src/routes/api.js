"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const buyController_1 = require("../controllers/buyController");
const sellController_1 = require("../controllers/sellController");
const priceController_1 = require("../controllers/priceController");
const balanceController_1 = require("../controllers/balanceController");
const router = express_1.default.Router();
// Transaction endpoints
router.post('/buy', buyController_1.BuyController.buyRequest);
router.post('/sell', sellController_1.SellController.sellRequest);
// Information endpoints
router.get('/price', priceController_1.PriceController.getPrice);
router.get('/convert', priceController_1.PriceController.convertNairaToCrypto);
router.get('/balance', balanceController_1.BalanceController.getBalance);
// Add this line
router.get('/test', (req, res) => res.json({ message: 'API is working!' }));
exports.default = router;
//# sourceMappingURL=api.js.map