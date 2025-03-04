"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const sellController_1 = require("../controllers/sellController");
const router = express_1.default.Router();
/**
 * @route GET /api/sell/banks
 * @desc Get list of supported banks
 * @access Public
 */
router.get('/banks', sellController_1.SellController.getBanks);
/**
 * @route POST /api/sell/verify-account
 * @desc Verify a bank account
 * @access Public
 */
router.post('/verify-account', sellController_1.SellController.verifyBankAccount);
/**
 * @route POST /api/sell/crypto
 * @desc Process a sell request
 * @access Public
 */
router.post('/crypto', sellController_1.SellController.sellRequest);
/**
 * @route GET /api/sell/status/:transaction_id
 * @desc Check the status of a sell transaction
 * @access Public
 */
router.get('/status/:transaction_id', sellController_1.SellController.verifySellTransaction);
// Verify sell transaction
router.get('/verify/:transaction_id', sellController_1.SellController.verifySellTransaction);
exports.default = router;
