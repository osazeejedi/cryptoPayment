import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { apiRateLimiter } from './middleware/rateLimit';
import { errorHandler } from './utils/errorHandler';
import apiRoutes from './routes/api';
import webRoutes from './routes/web';
import paymentRoutes from './routes/paymentRoutes';
import debugRoutes from './routes/debugRoutes';
import sellRoutes from './routes/sellRoutes';
import transferRoutes from './routes/transferRoutes';
import swapRoutes from './routes/swapRoutes';
import authRoutes from './routes/authRoutes';
import walletRoutes from './routes/walletRoutes';
import { config } from '../config/env';
import { TransactionMonitor } from './jobs/transactionMonitor';
import swaggerUi from 'swagger-ui-express';
import swaggerSpecs from './config/swagger';
import userRoutes from './routes/userRoutes';
import virtualAccountRoutes from './routes/virtualAccountRoutes';

// Create Express application
const app = express();

// Trust proxy (needed for rate limiting behind proxies like ngrok)
app.set('trust proxy', 1);

// Apply middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true }));
app.use(apiRateLimiter); // Apply rate limiting

// Add Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Define routes
app.use('/api', apiRoutes);  // Register all API routes
app.use('/', webRoutes);     // Register web routes
app.use('/api/payment', paymentRoutes);
app.use('/debug', debugRoutes); // Register debug routes
app.use('/api/sell', sellRoutes);
app.use('/api/transfer', transferRoutes);
app.use('/api/swap', swapRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/user', userRoutes);
app.use('/api/virtual-account', virtualAccountRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = config.server.port;

// Only start the server if this file is run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    
    // Start transaction monitor
    TransactionMonitor.startMonitoring();
  });
}

export default app; 