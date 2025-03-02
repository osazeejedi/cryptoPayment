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

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling middleware
app.use(errorHandler);

export default app; 