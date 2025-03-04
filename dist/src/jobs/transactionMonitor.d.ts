export declare class TransactionMonitor {
    /**
     * Monitor pending blockchain transactions
     */
    static monitorPendingTransactions(): Promise<void>;
    /**
     * Start the transaction monitor
     */
    static startMonitoring(intervalMinutes?: number): void;
}
