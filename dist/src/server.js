"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const app_1 = __importDefault(require("./app"));
const env_1 = require("../config/env");
const transactionRecoveryJob_1 = require("./jobs/transactionRecoveryJob");
// Load environment variables
dotenv_1.default.config();
// Get port from environment variables or use default
const PORT = env_1.config.server.port || 3000;
// Start the server
app_1.default.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${env_1.config.app.env}`);
    console.log(`Base URL: ${env_1.config.app.baseUrl}`);
    console.log(`Korapay callback URL: ${env_1.config.payment.korapay.callbackUrl}`);
});
// Schedule transaction recovery job to run every 10 minutes
setInterval(transactionRecoveryJob_1.recoverPendingTransactions, 10 * 60 * 1000);
