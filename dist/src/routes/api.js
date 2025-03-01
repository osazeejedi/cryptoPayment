"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const buyController_1 = require("../controllers/buyController");
const sellController_1 = require("../controllers/sellController");
const router = express_1.default.Router();
router.post('/buy', buyController_1.BuyController.buyRequest);
router.post('/sell', sellController_1.SellController.sellRequest);
exports.default = router;
//# sourceMappingURL=api.js.map