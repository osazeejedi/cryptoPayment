"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const buyController_1 = require("../controllers/buyController");
const router = (0, express_1.Router)();
// Use the correct method name that exists in BuyController
router.get('/verify/:transaction_id', buyController_1.BuyController.verifyBuyTransaction);
// Or if you need to create the method in BuyController:
// Uncomment one of these options:
// 1. Comment out this route until you implement the method
// router.get('/verify/:transaction_id', BuyController.verifyBuyTransaction);
// 2. Or use a different existing method temporarily
// router.get('/verify/:transaction_id', BuyController.buyRequest);
// Add your other buy routes here
// For example:
// router.post('/', BuyController.buyRequest);
exports.default = router;
