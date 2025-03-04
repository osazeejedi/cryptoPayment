"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebugController = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class DebugController {
    static async logRequest(req, res) {
        try {
            // Log the entire request
            const requestLog = {
                timestamp: new Date().toISOString(),
                method: req.method,
                url: req.url,
                headers: req.headers,
                body: req.body,
                query: req.query,
                params: req.params,
                ip: req.ip
            };
            console.log('=== DEBUG REQUEST RECEIVED ===');
            console.log(JSON.stringify(requestLog, null, 2));
            // Also write to a file for persistence
            const logDir = path_1.default.resolve(__dirname, '../../logs');
            if (!fs_1.default.existsSync(logDir)) {
                fs_1.default.mkdirSync(logDir, { recursive: true });
            }
            const logFile = path_1.default.join(logDir, 'webhook-debug.log');
            fs_1.default.appendFileSync(logFile, JSON.stringify(requestLog, null, 2) + '\n---\n');
            // Always return 200 OK to acknowledge receipt
            res.status(200).json({ status: 'success', message: 'Request logged' });
        }
        catch (error) {
            console.error('Error logging request:', error);
            res.status(200).json({ status: 'error', message: 'Error logging request' });
        }
    }
}
exports.DebugController = DebugController;
