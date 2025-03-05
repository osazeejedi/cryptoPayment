export interface User {
  id: string;
  email: string;
  full_name?: string;
  phone_number?: string;
  created_at: string;
  updated_at?: string;
  last_login?: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  address: string;
  crypto_type: string;
  is_primary: boolean;
  label?: string;
  created_at: string;
  private_key?: string; // Note: In production, don't store private keys in the database
}

export interface Transaction {
  id: string;
  user_id: string;
  transaction_type: 'buy' | 'sell' | 'transfer';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  amount: string;
  crypto_type: string;
  from_address?: string;
  to_address: string;
  blockchain_tx_hash?: string;
  fiat_amount?: string;
  fiat_currency?: string;
  payment_reference?: string;
  payment_method?: string;
  notes?: string;
  created_at: string;
}

export interface TransactionData {
  id?: string;
  user_id: string;
  amount: string;
  cryptoAmount: string;
  cryptoType: string;
  walletAddress: string;
  status: string;
  paymentMethod: string;
  blockchainTxHash?: string;
  paymentReference?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
  transaction_type?: string;
  to_address?: string;
  fiat_amount?: string;
  fiat_currency?: string;
  type: 'buy' | 'sell' | 'transfer';
} 