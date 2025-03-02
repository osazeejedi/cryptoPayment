import express from 'express';
import { SellController } from '../controllers/sellController';

const router = express.Router();

/**
 * @route GET /api/sell/banks
 * @desc Get list of supported banks
 * @access Public
 */
router.get('/banks', SellController.getBanks);

/**
 * @route POST /api/sell/verify-account
 * @desc Verify a bank account
 * @access Public
 */
router.post('/verify-account', SellController.verifyBankAccount);

/**
 * @route POST /api/sell/crypto
 * @desc Process a sell request
 * @access Public
 */
router.post('/crypto', SellController.sellRequest);

/**
 * @route GET /api/sell/status/:transaction_id
 * @desc Check the status of a sell transaction
 * @access Public
 */
router.get('/status/:transaction_id', SellController.verifySellTransaction);

// Verify sell transaction
router.get('/verify/:transaction_id', SellController.verifySellTransaction);

export default router; 