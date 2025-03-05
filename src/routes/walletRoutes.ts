import { Router, Request, Response, NextFunction } from 'express';
import { WalletController } from '../controllers/walletController';
import { authenticateUser } from '../middleware/auth';
import { AuthenticatedRequest } from '../types/express';

const router = Router();

/**
 * @swagger
 * /api/wallet:
 *   get:
 *     summary: Get user's wallet information
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet information retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Wallet not found
 */
router.get('/', authenticateUser, (req: Request, res: Response, next: NextFunction) => 
  WalletController.getUserWallet(req as AuthenticatedRequest, res).catch(next));

/**
 * @swagger
 * /api/wallet/private-key:
 *   post:
 *     summary: Get user's wallet private key (requires password confirmation)
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 description: User's password for confirmation
 *     responses:
 *       200:
 *         description: Private key retrieved successfully
 *       400:
 *         description: Password confirmation required
 *       401:
 *         description: Unauthorized or invalid password
 *       404:
 *         description: Wallet not found
 */
router.post('/private-key', authenticateUser, (req: Request, res: Response, next: NextFunction) => 
  WalletController.getWalletPrivateKey(req as AuthenticatedRequest, res).catch(next));

/**
 * @swagger
 * /api/wallet/transactions:
 *   get:
 *     summary: Get user's transaction history
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [buy, sell, transfer]
 *         description: Filter by transaction type
 *     responses:
 *       200:
 *         description: Transaction history retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/transactions', authenticateUser, (req: Request, res: Response, next: NextFunction) => 
  WalletController.getUserTransactions(req as AuthenticatedRequest, res).catch(next));

export default router; 