"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const transferController_1 = require("../controllers/transferController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Transfer crypto
router.post('/', auth_1.authenticateUser, transferController_1.TransferController.sendCrypto);
// Get transfer fee estimate
router.get('/fee', transferController_1.TransferController.getTransferFee);
exports.default = router;
