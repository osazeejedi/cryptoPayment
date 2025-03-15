import axios from 'axios';
import { config } from '../../config/env';
import { v4 as uuidv4 } from 'uuid';

interface VirtualAccountRequest {
  account_name: string;
  account_reference: string;
  permanent: boolean;
  bank_code: string;
  customer: {
    name: string;
    email: string;
  };
  kyc: {
    bvn: string;
  };
}

interface VirtualAccountWebhookData {
  reference: string;
  currency: string;
  amount: number;
  fee: number;
  status: string;
  virtual_bank_account_details: {
    payer_bank_account: {
      account_name: string;
      account_number: string;
      bank_name: string;
    };
    virtual_bank_account: {
      account_name: string;
      account_number: string;
      account_reference: string;
      bank_name: string;
    };
  };
  transaction_date: string;
}

interface ChargeQueryResponse {
  status: boolean;
  message: string;
  data: {
    reference: string;
    status: string;
    amount: string;
    amount_paid: string;
    fee: number;
    currency: string;
    description: string;
    customer: {
      name: string;
      email: string;
    };
    virtual_bank_account: {
      account_number: string;
      account_name: string;
      account_reference: string;
      transaction_narration: string;
      payer_bank_account: {
        account_number: string;
        account_name: string;
        bank_name: string;
      };
    };
  };
}

interface VirtualAccountMapping {
  crypto_type: string;
  wallet_address: string;
}

export class VirtualAccountService {
  private static BASE_URL = 'https://api.korapay.com/merchant/api/v1';
  private static SECRET_KEY = config.payment.korapay.secretKey;
  private static accountMappings: Record<string, VirtualAccountMapping> = {
    'customer005': {
      crypto_type: 'ETH',
      wallet_address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
    },
    'customer006': {
      crypto_type: 'TRX',
      wallet_address: 'TJYeasTPa6gpEEfYqJFTAJmfUvHJPdQS1V' // Example Tron address
    },
    'customer007': {
      crypto_type: 'USDT_TRC20',
      wallet_address: 'TJYeasTPa6gpEEfYqJFTAJmfUvHJPdQS1V' // Example Tron address
    }
    // Add more mappings as needed
  };

  /**
   * Create a permanent virtual account for a user
   */
  static async createVirtualAccount(data: {
    account_name: string;
    bank_code: string;
    customer_name: string;
    customer_email: string;
    bvn: string;
  }) {
    try {
      // Validate BVN
      if (!data.bvn || data.bvn.length !== 11) {
        throw new Error('Valid BVN is required');
      }

      const reference = `VA-${uuidv4()}`;

      const payload: VirtualAccountRequest = {
        account_name: data.account_name,
        account_reference: reference,
        permanent: true, // Always create permanent accounts
        bank_code: data.bank_code,
        customer: {
          name: data.customer_name,
          email: data.customer_email
        },
        kyc: {
          bvn: data.bvn
        }
      };

      console.log('Creating virtual account with payload:', JSON.stringify(payload, null, 2));

      const response = await axios.post(
        `${this.BASE_URL}/virtual-bank-account`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.SECRET_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.data;
    } catch (error) {
      console.error('Error creating virtual account:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('Korapay API error:', error.response.data);
        throw new Error(`Failed to create virtual account: ${JSON.stringify(error.response.data)}`);
      }
      throw new Error('Failed to create virtual account');
    }
  }

  /**
   * Verify a virtual account transaction
   */
  static async verifyTransaction(reference: string) {
    try {
      const response = await axios.get(
        `${this.BASE_URL}/transactions/reference/${reference}`,
        {
          headers: {
            'Authorization': `Bearer ${this.SECRET_KEY}`
          }
        }
      );

      return response.data.data;
    } catch (error) {
      console.error('Error verifying transaction:', error);
      throw new Error('Failed to verify transaction');
    }
  }

  /**
   * Get payment details for a virtual account transaction
   */
  static async getPaymentDetails(reference: string): Promise<ChargeQueryResponse> {
    try {
      const response = await axios.get(
        `${this.BASE_URL}/charges/${reference}`,
        {
          headers: {
            'Authorization': `Bearer ${this.SECRET_KEY}`
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error getting payment details:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(`Failed to get payment details: ${JSON.stringify(error.response.data)}`);
      }
      throw new Error('Failed to get payment details');
    }
  }

  static getAccountMapping(accountReference: string): VirtualAccountMapping | null {
    return this.accountMappings[accountReference] || null;
  }
} 