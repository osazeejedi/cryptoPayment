import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
// import morgan from 'morgan'; // Remove this import if causing issues
import { apiRateLimiter } from './middleware/rateLimit';
import { errorHandler } from './utils/errorHandler';
import apiRoutes from './routes/api'; // Remove this import if causing issues
// import webRoutes from './routes/web'; // Remove this import if causing issues
import paymentRoutes from './routes/paymentRoutes';
// import debugRoutes from './routes/debugRoutes'; // Remove this import if causing issues
import sellRoutes from './routes/sellRoutes';
import transferRoutes from './routes/transferRoutes';
// import swapRoutes from './routes/swapRoutes'; // Remove this import if causing issues
import authRoutes from './routes/authRoutes';
import walletRoutes from './routes/walletRoutes';
import { config } from '../config/env'; // Keep the original import path
import { TransactionMonitor } from './jobs/transactionMonitor'; // Remove this import if causing issues
// import swaggerUi from 'swagger-ui-express'; // Remove this import if causing issues
// import swaggerSpecs from './config/swagger'; // Remove this import if causing issues
import userRoutes from './routes/userRoutes';
import virtualAccountRoutes from './routes/virtualAccountRoutes';
import transactionRoutes from './routes/transactionRoutes';
import buyRoutes from './routes/buyRoutes';
import swapRoutes from './routes/swapRoutes';

// Create Express application
const app = express();

// Trust proxy (needed for rate limiting behind proxies like ngrok)
app.set('trust proxy', 1);

// Apply middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json({ 
  verify: (req: any, res, buf) => {
    // Store the raw body for signature verification
    req.rawBody = buf;
  }
})); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true }));
app.use(apiRateLimiter); // Apply rate limiting

// Add Swagger documentation
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs)); // Comment out if causing issues

// Define routes
app.use('/api', apiRoutes);  // Comment out if causing issues
// app.use('/', webRoutes);     // Comment out if causing issues - removed due to undefined variable
app.use('/api/payment', paymentRoutes);
// app.use('/debug', debugRoutes); // Comment out if causing issues
app.use('/api/sell', sellRoutes);
app.use('/api/transfer', transferRoutes);
app.use('/api/swap', swapRoutes); // Comment out if causing issues
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/user', userRoutes);
app.use('/api/virtual-account', virtualAccountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/buy', buyRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Service is running' });
});

// Error handling middleware
app.use(errorHandler);

// Export the app
export default app; 