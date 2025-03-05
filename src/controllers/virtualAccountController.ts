import { Request, Response } from 'express';
import axios from 'axios';
import { config } from '../../config/env';
import { supabase } from '../../config/supabase';
import { v4 as uuidv4 } from 'uuid';
import { AuthenticatedRequest } from '../types/express';
import { handleError } from '../utils/errorHandler';

export class VirtualAccountController {
  /**
   * Create a virtual account for a user
   */
  static async createVirtualAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user.id;
      const { amount, narration, currency = 'NGN' } = req.body;
      
      // Validate input
      if (!amount) {
        res.status(400).json({
          status: 'error',
          message: 'Amount is required'
        });
        return;
      }
      
      // Get user details
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('email, name, phone_number')
        .eq('id', userId)
        .single();
      
      if (userError || !user) {
        res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
        return;
      }
      
      // Generate a unique reference
      const reference = `VA-${uuidv4()}`;
      
      // Create virtual account request payload
      const payload = {
        reference,
        customer: {
          name: user.name || 'Customer',
          email: user.email
        },
        notification_url: config.payment.korapay.callbackUrl,
        amount: parseFloat(amount),
        currency,
        narration: narration || `Virtual account funding for ${user.email}`,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days expiry
      };
      
      // Make API request to Korapay
      const response = await axios.post(
        `${config.payment.korapay.baseUrl}/merchant/api/v1/virtual-bank-account`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.payment.korapay.secretKey}`
          }
        }
      );
      
      // Save virtual account to database
      await supabase.from('virtual_accounts').insert({
        user_id: userId,
        reference,
        amount: parseFloat(amount),
        currency,
        status: 'pending',
        account_details: response.data.data,
        expires_at: payload.expires_at
      });
      
      res.status(200).json({
        status: 'success',
        message: 'Virtual account created successfully',
        data: {
          reference,
          account_details: response.data.data,
          expires_at: payload.expires_at
        }
      });
    } catch (error) {
      handleError(error, res, 'Failed to create virtual account');
    }
  }
  
  /**
   * Get user's virtual accounts
   */
  static async getUserVirtualAccounts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user.id;
      const { status } = req.query;
      
      // Build query
      let query = supabase
        .from('virtual_accounts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      // Add filter by status if provided
      if (status) {
        query = query.eq('status', status);
      }
      
      // Execute query
      const { data: accounts, error } = await query;
      
      if (error) {
        res.status(500).json({
          status: 'error',
          message: 'Failed to fetch virtual accounts'
        });
        return;
      }
      
      res.status(200).json({
        status: 'success',
        data: accounts
      });
    } catch (error) {
      handleError(error, res, 'Failed to get user virtual accounts');
    }
  }
  
  /**
   * Get virtual account details
   */
  static async getVirtualAccountDetails(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user.id;
      const { reference } = req.params;
      
      // Get virtual account from database
      const { data: account, error } = await supabase
        .from('virtual_accounts')
        .select('*')
        .eq('reference', reference)
        .single();
      
      if (error || !account) {
        res.status(404).json({
          status: 'error',
          message: 'Virtual account not found'
        });
        return;
      }
      
      // Check if account belongs to user
      if (account.user_id !== userId) {
        res.status(403).json({
          status: 'error',
          message: 'Unauthorized access to virtual account'
        });
        return;
      }
      
      // Check account status with Korapay
      const response = await axios.get(
        `${config.payment.korapay.baseUrl}/merchant/api/v1/virtual-bank-account/${reference}`,
        {
          headers: {
            'Authorization': `Bearer ${config.payment.korapay.secretKey}`
          }
        }
      );
      
      // Update account status if needed
      if (response.data.data.status !== account.status) {
        await supabase
          .from('virtual_accounts')
          .update({ status: response.data.data.status })
          .eq('reference', reference);
          
        account.status = response.data.data.status;
      }
      
      res.status(200).json({
        status: 'success',
        data: {
          ...account,
          korapay_details: response.data.data
        }
      });
    } catch (error) {
      handleError(error, res, 'Failed to get virtual account details');
    }
  }
  
  /**
   * Handle Korapay webhook for virtual account transactions
   */
  static async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const { event, data } = req.body;
      
      // Verify webhook signature
      // This should be implemented for production
      
      if (event === 'charge.success' && data.payment_method === 'virtual_account') {
        const reference = data.reference;
        
        // Update virtual account status
        const { data: account, error } = await supabase
          .from('virtual_accounts')
          .update({ 
            status: 'completed',
            transaction_reference: data.transaction_reference,
            paid_at: new Date().toISOString()
          })
          .eq('reference', reference)
          .select()
          .single();
        
        if (!error && account) {
          // Create transaction record
          await supabase.from('transactions').insert({
            user_id: account.user_id,
            transaction_type: 'deposit',
            amount: account.amount,
            currency: account.currency,
            status: 'completed',
            payment_method: 'virtual_account',
            reference: reference,
            transaction_reference: data.transaction_reference
          });
          
          // Credit user's wallet (implementation depends on your system)
          // This is where you would add the funds to the user's wallet
        }
      }
      
      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }
} 