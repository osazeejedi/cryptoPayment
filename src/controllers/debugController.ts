import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

export class DebugController {
  static async logRequest(req: Request, res: Response): Promise<void> {
    try {
      // Log the entire request
      const requestLog = {
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body,
        query: req.query,
        params: req.params,
        ip: req.ip
      };
      
      console.log('=== DEBUG REQUEST RECEIVED ===');
      console.log(JSON.stringify(requestLog, null, 2));
      
      // Also write to a file for persistence
      const logDir = path.resolve(__dirname, '../../logs');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      
      const logFile = path.join(logDir, 'webhook-debug.log');
      fs.appendFileSync(
        logFile, 
        JSON.stringify(requestLog, null, 2) + '\n---\n'
      );
      
      // Always return 200 OK to acknowledge receipt
      res.status(200).json({ status: 'success', message: 'Request logged' });
    } catch (error) {
      console.error('Error logging request:', error);
      res.status(200).json({ status: 'error', message: 'Error logging request' });
    }
  }
} 