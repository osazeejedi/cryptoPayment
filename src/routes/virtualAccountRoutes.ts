import { Router, Request, Response, NextFunction } from 'express';
import { VirtualAccountController } from '../controllers/virtualAccountController';
import { authenticateUser } from '../middleware/auth';
import { AuthenticatedRequest } from '../types/express';

const router = Router();

/**
 * @swagger
 * /api/virtual-account:
 *   post:
 *     summary: Create a virtual account for a user
 *     tags: [Virtual Account]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Amount to be paid
 *               narration:
 *                 type: string
 *                 description: Description for the payment
 *               currency:
 *                 type: string
 *                 default: NGN
 *                 description: Currency code
 *     responses:
 *       200:
 *         description: Virtual account created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticateUser, (req: Request, res: Response, next: NextFunction) => 
  VirtualAccountController.createVirtualAccount(req as AuthenticatedRequest, res).catch(next));

/**
 * @swagger
 * /api/virtual-account/list:
 *   get:
 *     summary: Get user's virtual accounts
 *     tags: [Virtual Account]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, expired]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: Virtual accounts retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/list', authenticateUser, (req: Request, res: Response, next: NextFunction) => 
  VirtualAccountController.getUserVirtualAccounts(req as AuthenticatedRequest, res).catch(next));

/**
 * @swagger
 * /api/virtual-account/{reference}:
 *   get:
 *     summary: Get virtual account details
 *     tags: [Virtual Account]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *         description: Virtual account reference
 *     responses:
 *       200:
 *         description: Virtual account details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Virtual account not found
 */
router.get('/:reference', authenticateUser, (req: Request, res: Response, next: NextFunction) => 
  VirtualAccountController.getVirtualAccountDetails(req as AuthenticatedRequest, res).catch(next));

/**
 * @swagger
 * /api/virtual-account/webhook:
 *   post:
 *     summary: Handle Korapay webhook for virtual account transactions
 *     tags: [Virtual Account]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       500:
 *         description: Webhook processing failed
 */
router.post('/webhook', VirtualAccountController.handleWebhook);

export default router; 