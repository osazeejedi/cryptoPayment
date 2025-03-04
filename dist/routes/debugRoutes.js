"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const debugController_1 = require("../controllers/debugController");
const router = (0, express_1.Router)();
// Log all requests to this endpoint
router.all('/log', debugController_1.DebugController.logRequest);
// Simple test endpoint
router.get('/test', (req, res) => {
    res.status(200).json({ status: 'success', message: 'Debug test endpoint is working' });
});
exports.default = router;
