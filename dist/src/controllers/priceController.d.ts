import { Request, Response } from 'express';
export declare class PriceController {
    static getPrice(req: Request, res: Response): Promise<void>;
    static convertNairaToCrypto(req: Request, res: Response): Promise<void>;
}
