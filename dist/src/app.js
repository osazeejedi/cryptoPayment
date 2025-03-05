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
const web_1 = __importDefault(require("./routes/web"));
const paymentRoutes_1 = __importDefault(require("./routes/paymentRoutes"));
const debugRoutes_1 = __importDefault(require("./routes/debugRoutes"));
const sellRoutes_1 = __importDefault(require("./routes/sellRoutes"));
const transferRoutes_1 = __importDefault(require("./routes/transferRoutes"));
const swapRoutes_1 = __importDefault(require("./routes/swapRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const walletRoutes_1 = __importDefault(require("./routes/walletRoutes"));
const env_1 = require("../config/env");
const transactionMonitor_1 = require("./jobs/transactionMonitor");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = __importDefault(require("./config/swagger"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const virtualAccountRoutes_1 = __importDefault(require("./routes/virtualAccountRoutes"));
// Create Express application
const app = (0, express_1.default)();
// Trust proxy (needed for rate limiting behind proxies like ngrok)
app.set('trust proxy', 1);
// Apply middleware
app.use((0, helmet_1.default)()); // Security headers
app.use((0, cors_1.default)()); // Enable CORS
app.use(express_1.default.json()); // Parse JSON request bodies
app.use(express_1.default.urlencoded({ extended: true }));
app.use(rateLimit_1.apiRateLimiter); // Apply rate limiting
// Add Swagger documentation
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.default));
// Define routes
app.use('/api', api_1.default); // Register all API routes
app.use('/', web_1.default); // Register web routes
app.use('/api/payment', paymentRoutes_1.default);
app.use('/debug', debugRoutes_1.default); // Register debug routes
app.use('/api/sell', sellRoutes_1.default);
app.use('/api/transfer', transferRoutes_1.default);
app.use('/api/swap', swapRoutes_1.default);
app.use('/api/auth', authRoutes_1.default);
app.use('/api/wallet', walletRoutes_1.default);
app.use('/api/user', userRoutes_1.default);
app.use('/api/virtual-account', virtualAccountRoutes_1.default);
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});
// Error handling middleware
app.use(errorHandler_1.errorHandler);
// Start server
const PORT = env_1.config.server.port;
// Only start the server if this file is run directly
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        // Start transaction monitor
        transactionMonitor_1.TransactionMonitor.startMonitoring();
    });
}
exports.default = app;
