"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const rateLimit_1 = require("./middleware/rateLimit");
const errorHandler_1 = require("./utils/errorHandler");
const api_1 = __importDefault(require("./routes/api"));
// Create Express application
const app = (0, express_1.default)();
// Apply middleware
app.use((0, helmet_1.default)()); // Security headers
app.use((0, cors_1.default)()); // Enable CORS
app.use(express_1.default.json()); // Parse JSON request bodies
app.use(rateLimit_1.apiRateLimiter); // Apply rate limiting
// Define routes
app.use('/api', api_1.default); // Register all API routes
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});
// Error handling middleware
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map