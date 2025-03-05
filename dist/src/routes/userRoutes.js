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
router.get('/:userId/profile', userController_1.UserController.getUserProfile);
// Create a new wallet
router.post('/:userId/wallets', userController_1.UserController.createWallet);
// Get user transactions
router.get('/:userId/transactions', userController_1.UserController.getUserTransactions);
// Get wallet transactions
router.get('/:userId/wallets/:walletAddress/transactions', userController_1.UserController.getWalletTransactions);
exports.default = router;
