"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const swapController_1 = require("../controllers/swapController");
const router = (0, express_1.Router)();
// Swap cryptocurrency
router.post('/execute', swapController_1.SwapController.swapCrypto);
// Get swap estimate
router.get('/estimate', swapController_1.SwapController.getSwapEstimate);
exports.default = router;
