import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { BuyController } from './controllers/buyController';
import { SellController } from './controllers/sellController';
import { apiRateLimiter } from './middleware/rateLimit';
import { errorHandler } from './utils/errorHandler';
import apiRoutes from './routes/api';

// Create Express application
const app = express();

// Apply middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON request bodies
app.use(apiRateLimiter); // Apply rate limiting

// Define routes
app.post('/api/buy', BuyController.buyRequest);
app.post('/api/sell', SellController.sellRequest);
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling middleware
app.use(errorHandler);

export default app; 