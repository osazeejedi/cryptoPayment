# Korapay Testing Guide

This guide provides information on how to test your Korapay integration using their test environment.

## Test Cards

Use these test cards to simulate different payment scenarios:

### Successful Payment
- Card Number: 5399 8383 8383 8381
- Expiry Date: Any future date (e.g., 10/25)
- CVV: Any 3 digits (e.g., 123)
- PIN: Any 4 digits (e.g., 1234)
- OTP: 123456

### Failed Payment
- Card Number: 5399 8383 8383 8399
- Expiry Date: Any future date (e.g., 10/25)
- CVV: Any 3 digits (e.g., 123)
- PIN: Any 4 digits (e.g., 1234)
- OTP: 123456

## Test Bank Accounts

For bank transfer testing, use these test accounts:

### GTBank
- Account Number: 0000000000
- Bank: GTBank (058)

### Access Bank
- Account Number: 0000000000
- Bank: Access Bank (044)

## Testing Webhooks

To test webhooks locally, you can use ngrok to expose your local server:

1. Install ngrok: https://ngrok.com/download
2. Run your server locally
3. In a new terminal, run: `ngrok http 3000`
4. Copy the HTTPS URL provided by ngrok
5. Update your `.env` file with:
   ```
   KORAPAY_CALLBACK_URL=https://your-ngrok-url.ngrok-free.app/api/payment/webhook
   ```
6. Restart your server

## Verifying Payments

After a payment is made, you can verify it using:

```typescript
const paymentDetails = await KorapayService.verifyPayment(reference);
```

The response will include the payment status and other details.

## Common Issues

1. **401 Unauthorized**: Check that your API keys are correct and properly formatted
2. **Invalid Card Details**: Make sure you're using the test cards exactly as specified
3. **Webhook Not Received**: Ensure your ngrok URL is correct and your server is running
4. **Redirect Not Working**: Check that your redirect URL is properly configured

For more information, refer to the official Korapay documentation. 