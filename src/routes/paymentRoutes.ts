import { Router } from 'express';
import { PaymentController } from '../controllers/paymentController';

const router = Router();

/**
 * @swagger
 * /api/payment/checkout:
 *   post:
 *     summary: Generate payment checkout URL
 *     tags: [Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - email
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Amount to be paid
 *               email:
 *                 type: string
 *                 description: Customer email
 *               name:
 *                 type: string
 *                 description: Customer name
 *               phone:
 *                 type: string
 *                 description: Customer phone number
 *               reference:
 *                 type: string
 *                 description: Unique payment reference (generated if not provided)
 *               callbackUrl:
 *                 type: string
 *                 description: URL to redirect after payment
 *               channels:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [card, bank_transfer, ussd, virtual_account]
 *                 description: Payment channels to enable
 *     responses:
 *       200:
 *         description: Checkout URL generated successfully
 *       400:
 *         description: Invalid input
 */
router.post('/checkout', PaymentController.processCheckout);

/**
 * @swagger
 * /api/payment/verify/{reference}:
 *   get:
 *     summary: Verify payment status
 *     tags: [Payment]
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment reference
 *     responses:
 *       200:
 *         description: Payment status retrieved successfully
 *       400:
 *         description: Invalid reference
 */
router.get('/verify/:reference', PaymentController.verifyPayment);

/**
 * @swagger
 * /api/payment/webhook:
 *   post:
 *     summary: Handle payment webhook
 *     tags: [Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 */
router.post('/webhook', PaymentController.handleWebhook);

export default router; 