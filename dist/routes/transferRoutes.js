"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const transferController_1 = require("../controllers/transferController");
const router = (0, express_1.Router)();
// Send cryptocurrency
router.post('/send', transferController_1.TransferController.sendCrypto);
// Get wallet balance
router.get('/balance', transferController_1.TransferController.getBalance);
exports.default = router;
