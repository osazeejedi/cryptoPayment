"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentNotificationService = void 0;
class PaymentNotificationService {
    /**
     * Store a new payment notification
     */
    static storePayment(payment) {
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
    static getRecentPayments(limit = 10) {
        return this.recentPayments.slice(0, limit);
    }
    /**
     * Get payment by reference
     */
    static getPaymentByReference(reference) {
        return this.recentPayments.find(p => p.reference === reference) || null;
    }
    /**
     * Get payments newer than a timestamp
     */
    static getPaymentsSince(timestamp) {
        return this.recentPayments.filter(p => p.timestamp > timestamp);
    }
}
exports.PaymentNotificationService = PaymentNotificationService;
PaymentNotificationService.recentPayments = [];
PaymentNotificationService.maxStoredPayments = 100;
