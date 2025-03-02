import express from 'express';
import path from 'path';

const router = express.Router();

// Serve a simple payment form for testing
router.get('/payment', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Crypto Payment</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 500px;
            margin: 0 auto;
            padding: 20px;
          }
          .form-group {
            margin-bottom: 15px;
          }
          label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
          }
          input, select {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-sizing: border-box;
          }
          button {
            background-color: #4CAF50;
            color: white;
            padding: 10px 15px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
          }
          button:hover {
            background-color: #45a049;
          }
          .result {
            margin-top: 20px;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 4px;
            display: none;
          }
          .checkout-btn {
            display: block;
            text-align: center;
            background-color: #007bff;
            color: white;
            padding: 10px 15px;
            text-decoration: none;
            border-radius: 4px;
            margin-top: 15px;
          }
          .test-info {
            margin-top: 20px;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 4px;
            background-color: #f8f9fa;
          }
          .test-info h3 {
            margin-top: 0;
            color: #333;
          }
          .test-info p {
            margin: 5px 0;
          }
        </style>
      </head>
      <body>
        <h1>Buy Cryptocurrency</h1>
        
        <div class="test-info">
          <h3>Test Card Information</h3>
          <p><strong>Card Number:</strong> 5399 8383 8383 8381</p>
          <p><strong>Expiry Date:</strong> Any future date (e.g., 10/25)</p>
          <p><strong>CVV:</strong> Any 3 digits (e.g., 123)</p>
          <p><strong>PIN:</strong> Any 4 digits (e.g., 1234)</p>
          <p><strong>OTP:</strong> 123456</p>
        </div>
        
        <form id="paymentForm">
          <div class="form-group">
            <label for="naira_amount">Amount (NGN)</label>
            <input type="number" id="naira_amount" name="naira_amount" required min="500" value="500">
          </div>
          <div class="form-group">
            <label for="crypto_type">Cryptocurrency</label>
            <select id="crypto_type" name="crypto_type" required>
              <option value="ETH">Ethereum (ETH)</option>
              <option value="BTC">Bitcoin (BTC)</option>
            </select>
          </div>
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required value="customer@example.com">
          </div>
          <div class="form-group">
            <label for="name">Full Name</label>
            <input type="text" id="name" name="name" required value="Test Customer">
          </div>
          <div class="form-group">
            <label for="wallet_address">Wallet Address</label>
            <input type="text" id="wallet_address" name="wallet_address" required value="0x2A69d89043948999bD327413b7B4f91d47018873">
          </div>
          <button type="submit">Proceed to Payment</button>
        </form>
        
        <div id="result" class="result">
          <h3>Payment Details</h3>
          <p>Amount: <span id="result_amount"></span> NGN</p>
          <p>Crypto: <span id="result_crypto_amount"></span> <span id="result_crypto_type"></span></p>
          <p>Reference: <span id="result_reference"></span></p>
          <a id="checkout_url" href="#" class="checkout-btn" target="_blank">Complete Payment</a>
        </div>
        
        <script>
          document.getElementById('paymentForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = {
              naira_amount: document.getElementById('naira_amount').value,
              crypto_type: document.getElementById('crypto_type').value,
              email: document.getElementById('email').value,
              name: document.getElementById('name').value,
              wallet_address: document.getElementById('wallet_address').value
            };
            
            try {
              const response = await fetch('/api/payment/checkout', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
              });
              
              const data = await response.json();
              
              if (data.status === 'success') {
                document.getElementById('result_amount').textContent = data.data.naira_amount;
                document.getElementById('result_crypto_amount').textContent = data.data.crypto_amount;
                document.getElementById('result_crypto_type').textContent = data.data.crypto_type;
                document.getElementById('result_reference').textContent = data.data.reference;
                
                const checkoutLink = document.getElementById('checkout_url');
                checkoutLink.href = data.data.checkout_url;
                
                document.getElementById('result').style.display = 'block';
              } else {
                alert('Error: ' + data.message);
              }
            } catch (error) {
              console.error('Error:', error);
              alert('An error occurred. Please try again.');
            }
          });
        </script>
      </body>
    </html>
  `);
});

export default router; 