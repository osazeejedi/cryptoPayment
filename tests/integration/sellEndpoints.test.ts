import request from 'supertest';
import app from '../../src/app';

describe('Sell API Endpoints', () => {
  describe('GET /api/sell/banks', () => {
    it('should return a list of banks', async () => {
      const response = await request(app)
        .get('/api/sell/banks')
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('banks');
      expect(Array.isArray(response.body.data.banks)).toBe(true);
      
      // Check if banks have the expected structure
      if (response.body.data.banks.length > 0) {
        const firstBank = response.body.data.banks[0];
        expect(firstBank).toHaveProperty('code');
        expect(firstBank).toHaveProperty('name');
      }
    });
  });

  describe('POST /api/sell/verify-account', () => {
    it('should verify a valid bank account', async () => {
      const response = await request(app)
        .post('/api/sell/verify-account')
        .send({
          account_number: '1234567890',
          bank_code: '033'
        })
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('account_name');
      expect(response.body.data).toHaveProperty('account_number');
      expect(response.body.data).toHaveProperty('bank_code');
    });

    it('should return 400 for missing account details', async () => {
      const response = await request(app)
        .post('/api/sell/verify-account')
        .send({
          // Missing account_number
          bank_code: '033'
        })
        .expect('Content-Type', /json/)
        .expect(400);
      
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Account number and bank code are required');
    });

    it('should return 400 for invalid account details', async () => {
      // This test assumes your mock or API will reject invalid account numbers
      const response = await request(app)
        .post('/api/sell/verify-account')
        .send({
          account_number: '0000000000', // Invalid account number
          bank_code: '033'
        })
        .expect('Content-Type', /json/);
      
      // The status code might be 400 or 500 depending on how your API handles invalid accounts
      expect([400, 500]).toContain(response.status);
      expect(response.body.status).toBe('error');
    });
  });
}); 