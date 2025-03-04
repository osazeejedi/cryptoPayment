import axios from 'axios';
import { createServer } from 'http';
import app from '../src/app';
import { findAvailablePort } from './utils/testUtils';

describe('API Endpoints', () => {
  let server;
  let API_URL;
  
  beforeAll(async () => {
    // Find an available port and start the server
    const port = await findAvailablePort(3002);
    server = createServer(app).listen(port);
    API_URL = `http://localhost:${port}/api`;
  });
  
  afterAll(() => {
    // Close the server when tests are done
    if (server) server.close();
  });
  
  describe('Price Endpoint', () => {
    it('should return the current price of a cryptocurrency', async () => {
      const response = await axios.get(`${API_URL}/price?crypto=ETH`);
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.price).toBeDefined();
      expect(typeof response.data.data.price).toBe('number');
    });
  });
  
  describe('Health Check Endpoint', () => {
    it('should return a 200 status for the health check', async () => {
      const response = await axios.get(`${API_URL}/health`);
      
      expect(response.status).toBe(200);
      expect(response.data.status).toBe('ok');
    });
  });
}); 