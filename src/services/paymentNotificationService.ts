// Simple in-memory storage for recent payments
interface PaymentNotification {
  reference: string;
  amount: number;
  currency: string;
  status: string;
  payerName: string;
  accountReference: string;
  date: string;
  timestamp: number;
}

export class PaymentNotificationService {
  private static recentPayments: PaymentNotification[] = [];
  private static maxStoredPayments = 100;

  /**
   * Store a new payment notification
   */
  static storePayment(payment: PaymentNotification): void {
    // Add timestamp
    const paymentWithTimestamp = {
      ...payment,
      timestamp: Date.now()
    };
    
    // Add to beginning of array
    this.recentPayments.unshift(paymentWithTimestamp);
    
    // Limit array size
    if (this.recentPayments.length > this.maxStoredPayments) {
      this.recentPayments = this.recentPayments.slice(0, this.maxStoredPayments);
    }
    
    console.log(`Payment notification stored: ${payment.reference}`);
  }

  /**
   * Get recent payments
   */
  static getRecentPayments(limit: number = 10): PaymentNotification[] {
    return this.recentPayments.slice(0, limit);
  }

  /**
   * Get payment by reference
   */
  static getPaymentByReference(reference: string): PaymentNotification | null {
    return this.recentPayments.find(p => p.reference === reference) || null;
  }

  /**
   * Get payments newer than a timestamp
   */
  static getPaymentsSince(timestamp: number): PaymentNotification[] {
    return this.recentPayments.filter(p => p.timestamp > timestamp);
  }
}