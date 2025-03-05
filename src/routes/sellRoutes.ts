import { Router, Request, Response } from 'express';
import { SellController } from '../controllers/sellController';
import { authenticateUser } from '../middleware/auth';
import { AuthenticatedRequest } from '../types/express';

const router = Router();

/**
 * @route GET /api/sell/banks
 * @desc Get list of supported banks
 * @access Public
 */
router.get('/banks', (req: Request, res: Response) => {
  SellController.getBanks(req, res)
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
router.post('/verify-account', (req: Request, res: Response) => {
  SellController.verifyBankAccount(req, res)
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
router.post('/crypto', authenticateUser, (req: Request, res: Response) => {
  SellController.sellRequest(req, res)
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
router.get('/status/:transaction_id', (req: Request, res: Response) => {
  SellController.verifySellTransaction(req, res)
    .catch(err => {
      console.error('Error in verify sell transaction route:', err);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    });
});

// Verify sell transaction
router.get('/verify/:transaction_id', (req: Request, res: Response) => {
  SellController.verifySellTransaction(req, res)
    .catch(err => {
      console.error('Error in verify sell transaction route:', err);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    });
});

export default router; 