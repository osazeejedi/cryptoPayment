import { Router } from 'express';
import { DebugController } from '../controllers/debugController';

const router = Router();

// Log all requests to this endpoint
router.all('/log', DebugController.logRequest);

// Simple test endpoint
router.get('/test', (req, res) => {
  res.status(200).json({ status: 'success', message: 'Debug test endpoint is working' });
});

export default router; 