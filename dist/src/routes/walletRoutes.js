"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const walletController_1 = require("../controllers/walletController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Get user wallet
router.get('/', auth_1.authenticate, walletController_1.WalletController.getUserWallet);
// Get wallet balance
router.get('/balance/:address', auth_1.authenticate, walletController_1.WalletController.getWalletBalance);
exports.default = router;
