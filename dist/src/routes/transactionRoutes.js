"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const transactionController_1 = require("../controllers/transactionController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Get user transactions
router.get('/', auth_1.authenticateUser, (req, res, next) => transactionController_1.TransactionController.getUserTransactions(req, res).catch(next));
// Get transaction details
router.get('/:id', auth_1.authenticateUser, (req, res, next) => transactionController_1.TransactionController.getTransactionDetails(req, res).catch(next));
exports.default = router;
