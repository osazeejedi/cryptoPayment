"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
// import morgan from 'morgan'; // Remove this import if causing issues
const rateLimit_1 = require("./middleware/rateLimit");
const errorHandler_1 = require("./utils/errorHandler");
const api_1 = __importDefault(require("./routes/api")); // Remove this import if causing issues
// import webRoutes from './routes/web'; // Remove this import if causing issues
// import paymentRoutes from './routes/paymentRoutes';
// import debugRoutes from './routes/debugRoutes'; // Remove this import if causing issues
const sellRoutes_1 = __importDefault(require("./routes/sellRoutes"));
const transferRoutes_1 = __importDefault(require("./routes/transferRoutes"));
// import swapRoutes from './routes/swapRoutes'; // Remove this import if causing issues
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const walletRoutes_1 = __importDefault(require("./routes/walletRoutes"));
// import swaggerUi from 'swagger-ui-express'; // Remove this import if causing issues
// import swaggerSpecs from './config/swagger'; // Remove this import if causing issues
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const virtualAccountRoutes_1 = __importDefault(require("./routes/virtualAccountRoutes"));
const transactionRoutes_1 = __importDefault(require("./routes/transactionRoutes"));
const buyRoutes_1 = __importDefault(require("./routes/buyRoutes"));
const swapRoutes_1 = __importDefault(require("./routes/swapRoutes"));
// Create Express application
const app = (0, express_1.default)();
// Trust proxy (needed for rate limiting behind proxies like ngrok)
app.set('trust proxy', 1);
// Apply middleware
app.use((0, helmet_1.default)()); // Security headers
app.use((0, cors_1.default)()); // Enable CORS
app.use(express_1.default.json({
    verify: (req, res, buf) => {
        // Store the raw body for signature verification
        req.rawBody = buf;
    }
})); // Parse JSON request bodies
app.use(express_1.default.urlencoded({ extended: true }));
app.use(rateLimit_1.apiRateLimiter); // Apply rate limiting
// Add Swagger documentation
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs)); // Comment out if causing issues
// Define routes
app.use('/api', api_1.default); // Comment out if causing issues
// app.use('/', webRoutes);     // Comment out if causing issues - removed due to undefined variable
// app.use('/api/payment', paymentRoutes);
// app.use('/debug', debugRoutes); // Comment out if causing issues
app.use('/api/sell', sellRoutes_1.default);
app.use('/api/transfer', transferRoutes_1.default);
app.use('/api/swap', swapRoutes_1.default); // Comment out if causing issues
app.use('/api/auth', authRoutes_1.default);
app.use('/api/wallet', walletRoutes_1.default);
app.use('/api/user', userRoutes_1.default);
app.use('/api/virtual-account', virtualAccountRoutes_1.default);
app.use('/api/transactions', transactionRoutes_1.default);
// Add logging to verify mounting
console.log('Mounting routes...');
// Mount buy routes
app.use('/api/buy', buyRoutes_1.default);
// Add a root test endpoint
app.get('/test', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Service is running' });
});
// Error handling middleware
app.use(errorHandler_1.errorHandler);
console.log('Routes mounted');
// Export the app
exports.default = app;
