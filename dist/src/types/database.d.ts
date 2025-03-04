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
    private_key?: string;
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
