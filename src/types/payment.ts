export interface KorapayPaymentInitData {
  amount: string;
  currency: string;
  reference: string;
  customer: {
    email: string;
    name: string;
  };
  notification_url: string;
  metadata: {
    transaction_id: string;
    crypto_amount: string;
    crypto_type: string;
    wallet_address: string;
  };
}

// Keep this for backward compatibility
export interface PaymentInitData {
  amount: string;
  currency: string;
  reference: string;
  redirectUrl: string;
  customerEmail: string;
  customerName: string;
  metadata: any;
} 