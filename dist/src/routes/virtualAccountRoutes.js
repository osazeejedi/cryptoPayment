"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const virtualAccountController_1 = require("../controllers/virtualAccountController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
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
router.post('/', auth_1.authenticateUser, (req, res, next) => virtualAccountController_1.VirtualAccountController.createVirtualAccount(req, res).catch(next));
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
router.get('/list', auth_1.authenticateUser, (req, res, next) => virtualAccountController_1.VirtualAccountController.getUserVirtualAccounts(req, res).catch(next));
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
router.get('/:reference', auth_1.authenticateUser, (req, res, next) => virtualAccountController_1.VirtualAccountController.getVirtualAccountDetails(req, res).catch(next));
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
router.post('/webhook', virtualAccountController_1.VirtualAccountController.handleWebhook);
exports.default = router;
