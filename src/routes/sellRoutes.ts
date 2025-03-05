import express from 'express';
import { SellController } from '../controllers/sellController';
import { authenticateUser } from '../middleware/auth';
import { AuthenticatedRequest } from '../types/express';

const router = express.Router();

/**
 * @route GET /api/sell/banks
 * @desc Get list of supported banks
 * @access Public
 */
router.get('/banks', (req, res, next) => {
  try {
    SellController.getBanks(req, res);
  } catch (error) {
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
    SellController.verifyBankAccount(req, res);
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/sell/crypto
 * @desc Process a sell request
 * @access Public
 */
router.post('/crypto', authenticateUser, (req, res, next) => {
  try {
    SellController.sellRequest(req, res);
  } catch (error) {
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
    SellController.verifySellTransaction(req, res);
  } catch (error) {
    next(error);
  }
});

// Verify sell transaction
router.get('/verify/:transaction_id', (req, res, next) => {
  try {
    SellController.verifySellTransaction(req, res);
  } catch (error) {
    next(error);
  }
});

export default router; 