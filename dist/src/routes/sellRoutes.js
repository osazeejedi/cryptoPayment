"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sellController_1 = require("../controllers/sellController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
/**
 * @route GET /api/sell/banks
 * @desc Get list of supported banks
 * @access Public
 */
router.get('/banks', (req, res) => {
    sellController_1.SellController.getBanks(req, res)
        .catch(err => {
        console.error('Error in get banks route:', err);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    });
});
/**
 * @route POST /api/sell/verify-account
 * @desc Verify a bank account
 * @access Public
 */
router.post('/verify-account', (req, res) => {
    sellController_1.SellController.verifyBankAccount(req, res)
        .catch(err => {
        console.error('Error in verify bank account route:', err);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    });
});
/**
 * @route POST /api/sell/crypto
 * @desc Process a sell request
 * @access Public
 */
router.post('/crypto', auth_1.authenticateUser, (req, res) => {
    sellController_1.SellController.sellRequest(req, res)
        .catch(err => {
        console.error('Error in sell crypto route:', err);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    });
});
/**
 * @route GET /api/sell/status/:transaction_id
 * @desc Check the status of a sell transaction
 * @access Public
 */
router.get('/status/:transaction_id', (req, res) => {
    sellController_1.SellController.verifySellTransaction(req, res)
        .catch(err => {
        console.error('Error in verify sell transaction route:', err);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    });
});
// Verify sell transaction
router.get('/verify/:transaction_id', (req, res) => {
    sellController_1.SellController.verifySellTransaction(req, res)
        .catch(err => {
        console.error('Error in verify sell transaction route:', err);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    });
});
exports.default = router;
