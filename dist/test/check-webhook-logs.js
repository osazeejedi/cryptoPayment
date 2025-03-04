"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function checkWebhookLogs() {
    try {
        console.log('=== CHECKING WEBHOOK LOGS ===');
        const logDir = path_1.default.resolve(__dirname, '../logs');
        const logFile = path_1.default.join(logDir, 'webhook-debug.log');
        if (!fs_1.default.existsSync(logFile)) {
            console.log('No webhook logs found. Run a test payment first.');
            return;
        }
        const logs = fs_1.default.readFileSync(logFile, 'utf8');
        const logEntries = logs.split('---\n').filter(entry => entry.trim());
        console.log(`Found ${logEntries.length} log entries.`);
        if (logEntries.length === 0) {
            console.log('No webhook logs found. Run a test payment first.');
            return;
        }
        // Parse and display the most recent log entries
        const recentEntries = logEntries.slice(-3); // Get the last 3 entries
        console.log('\nMost recent webhook logs:');
        recentEntries.forEach((entry, index) => {
            try {
                const logData = JSON.parse(entry);
                console.log(`\n--- Log Entry ${index + 1} ---`);
                console.log('Timestamp:', logData.timestamp);
                console.log('Method:', logData.method);
                console.log('URL:', logData.url);
                console.log('Headers:', JSON.stringify(logData.headers, null, 2));
                // Check if this is a Korapay webhook
                const isKorapayWebhook = logData.headers['x-korapay-signature'] !== undefined;
                if (isKorapayWebhook) {
                    console.log('\nThis appears to be a Korapay webhook!');
                    console.log('Body:', JSON.stringify(logData.body, null, 2));
                }
                else {
                    console.log('Body:', JSON.stringify(logData.body, null, 2).substring(0, 200) + '...');
                }
            }
            catch (parseError) {
                console.log(`Error parsing log entry ${index + 1}:`, parseError);
                console.log('Raw entry:', entry.substring(0, 200) + '...');
            }
        });
        console.log('\n=== WEBHOOK LOG CHECK COMPLETED ===');
    }
    catch (error) {
        console.error('Error checking webhook logs:', error);
    }
}
checkWebhookLogs();
//# sourceMappingURL=check-webhook-logs.js.map