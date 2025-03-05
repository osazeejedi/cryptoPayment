import { Router, Request, Response, NextFunction } from 'express';
import { UserController } from '../controllers/userController';
import { authenticateUser } from '../middleware/auth';
import { AuthenticatedRequest } from '../types/express';

const router = Router();

// Public routes
router.post('/register', UserController.registerUser);

// Protected routes
router.use('/:userId', authenticateUser);

// Get user profile
router.get('/:userId/profile', (req: Request, res: Response, next: NextFunction) => {
  UserController.getUserProfile(req as AuthenticatedRequest, res).catch(next);
});

// Create a new wallet
router.post('/:userId/wallets', UserController.createWallet);

// Get user transactions
router.get('/:userId/transactions', UserController.getUserTransactions);

// Get wallet transactions
router.get('/:userId/wallets/:walletAddress/transactions', UserController.getWalletTransactions);

/**
 * @swagger
 * /api/user/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/profile', authenticateUser, (req: Request, res: Response, next: NextFunction) => 
  UserController.getUserProfile(req as AuthenticatedRequest, res).catch(next));

/**
 * @swagger
 * /api/user/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's full name
 *               phone_number:
 *                 type: string
 *                 description: User's phone number
 *               profile_image:
 *                 type: string
 *                 description: URL to user's profile image
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.put('/profile', authenticateUser, (req: Request, res: Response, next: NextFunction) => 
  UserController.updateUserProfile(req as AuthenticatedRequest, res).catch(next));

export default router; 