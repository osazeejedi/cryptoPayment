"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public routes
router.post('/register', userController_1.UserController.registerUser);
// Protected routes
router.use('/:userId', auth_1.authenticateUser);
// Get user profile
router.get('/:userId/profile', (req, res, next) => {
    userController_1.UserController.getUserProfile(req, res).catch(next);
});
// Create a new wallet
router.post('/:userId/wallets', userController_1.UserController.createWallet);
// Get user transactions
router.get('/:userId/transactions', userController_1.UserController.getUserTransactions);
// Get wallet transactions
router.get('/:userId/wallets/:walletAddress/transactions', userController_1.UserController.getWalletTransactions);
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
router.get('/profile', auth_1.authenticateUser, (req, res, next) => userController_1.UserController.getUserProfile(req, res).catch(next));
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
router.put('/profile', auth_1.authenticateUser, (req, res, next) => userController_1.UserController.updateUserProfile(req, res).catch(next));
exports.default = router;
