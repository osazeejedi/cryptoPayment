"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const sellController_1 = require("../controllers/sellController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
/**
 * @route GET /api/sell/banks
 * @desc Get list of supported banks
 * @access Public
 */
router.get('/banks', (req, res, next) => {
    try {
        sellController_1.SellController.getBanks(req, res);
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route POST /api/sell/verify-account
 * @desc Verify a bank account
 * @access Public
 */
router.post('/verify-account', (req, res, next) => {
    try {
        sellController_1.SellController.verifyBankAccount(req, res);
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route POST /api/sell/crypto
 * @desc Process a sell request
 * @access Public
 */
router.post('/crypto', auth_1.authenticateUser, (req, res, next) => {
    try {
        sellController_1.SellController.sellRequest(req, res);
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route GET /api/sell/status/:transaction_id
 * @desc Check the status of a sell transaction
 * @access Public
 */
router.get('/status/:transaction_id', (req, res, next) => {
    try {
        sellController_1.SellController.verifySellTransaction(req, res);
    }
    catch (error) {
        next(error);
    }
});
// Verify sell transaction
router.get('/verify/:transaction_id', (req, res, next) => {
    try {
        sellController_1.SellController.verifySellTransaction(req, res);
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
