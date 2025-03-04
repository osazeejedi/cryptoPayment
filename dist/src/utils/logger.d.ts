import winston from 'winston';
export declare const logger: winston.Logger;
export declare const blockchainLogger: {
    info: (message: string) => void;
    error: (message: string, error?: any) => void;
    warn: (message: string) => void;
    debug: (message: string) => void;
};
export declare const webhookLogger: {
    info: (message: string) => void;
    error: (message: string, error?: any) => void;
    debug: (message: string, data?: any) => void;
};
