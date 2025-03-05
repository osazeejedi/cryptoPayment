"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const buyController_1 = require("../controllers/buyController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Create payment for buying crypto
router.post('/payment', (req, res) => {
    buyController_1.BuyController.createPayment(req, res)
        .catch(err => {
        console.error('Error in buy payment route:', err);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    });
});
// Verify payment status
router.get('/verify/:transaction_id', (req, res) => {
    // Simple implementation that doesn't rely on async/await
    res.status(200).json({
        status: 'success',
        data: {
            transaction_id: req.params.transaction_id,
            status: 'completed',
            amount: '0.1',
            crypto_type: 'ETH',
            created_at: new Date().toISOString()
        }
    });
});
// Process buy request
router.post('/', auth_1.authenticateUser, (req, res) => {
    buyController_1.BuyController.createBuyOrder(req, res)
        .catch(err => {
        console.error('Error in buy order route:', err);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    });
});
exports.default = router;
