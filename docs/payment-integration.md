# Korapay Payment Integration

This document provides a comprehensive guide to the Korapay payment integration in our application.

## Overview

Our application uses Korapay to process payments in Nigerian Naira (NGN) for cryptocurrency purchases. We've implemented two main payment flows:

1. **Checkout Page**: A hosted payment page by Korapay that handles the payment process
2. **Direct API**: Direct API integration for card and bank transfer payments

## Implementation Details

### Endpoints

- `POST /api/payment/checkout`: Initialize a checkout page
- `POST /api/payment/card`: Process a direct card payment
- `POST /api/payment/bank-transfer`: Process a bank transfer
- `GET /api/payment/banks`: Get a list of supported banks
- `GET /api/payment/verify/:reference`: Verify a payment
- `POST /api/payment/webhook`: Handle payment webhooks
- `GET /api/payment/success`: Handle payment success redirects

### Services

- `KorapayService`: Handles all interactions with the Korapay API
- `PriceService`: Converts between Naira and cryptocurrency amounts
- `BlockchainService`: Handles the cryptocurrency transfer after payment

## Testing

### Test Environment

We use Korapay's test environment for development and testing. The test environment is completely separate from the production environment and uses test API keys.

### Test Cards

For testing card payments, use these test cards:

- **Successful Payment**:
  - Card Number: 5399 8383 8383 8381
  - Expiry Date: Any future date (e.g., 10/25)
  - CVV: Any 3 digits (e.g., 123)
  - PIN: Any 4 digits (e.g., 1234)
  - OTP: 123456

- **Failed Payment**:
  - Card Number: 5399 8383 8383 8399
  - Expiry Date: Any future date (e.g., 10/25)
  - CVV: Any 3 digits (e.g., 123)
  - PIN: Any 4 digits (e.g., 1234)
  - OTP: 123456

### Test Bank Accounts

For testing bank transfers, use these test accounts:

- **GTBank**:
  - Account Number: 0000000000
  - Bank: GTBank (058)

- **Access Bank**:
  - Account Number: 0000000000
  - Bank: Access Bank (044)

## Webhook Integration

Korapay sends webhooks to notify our application of payment events. We handle these webhooks in the `handleWebhook` method of the `PaymentController`.

To test webhooks locally, use ngrok to expose your local server:

```bash
ngrok http 3000
```

Then update your `.env` file with the ngrok URL:

```
KORAPAY_CALLBACK_URL=https://your-ngrok-url.ngrok-free.app/api/payment/webhook
```

## Mobile Integration

For mobile integration, we recommend using the checkout page approach with a WebView. This provides the best user experience and security.

See the [Flutter Integration Guide](./flutter-integration.md) for details on how to integrate with a Flutter mobile app.

## Production Considerations

Before going to production, consider these points:

1. **API Keys**: Replace test API keys with production keys
2. **Webhook URL**: Update the webhook URL to your production server
3. **Error Handling**: Implement comprehensive error handling
4. **Logging**: Add detailed logging for troubleshooting
5. **Database**: Store payment records in a database for reconciliation
6. **Idempotency**: Ensure payment processing is idempotent to prevent duplicate transactions

## Resources

- [Korapay Documentation](https://docs.korapay.com/)
- [Korapay Dashboard](https://dashboard.korapay.com/)
- [Korapay Support](https://support.korapay.com/) 