import { Response } from 'express';

export const sendSuccess = (res: Response, data: any, message: string = 'Success') => {
  return res.status(200).json({
    success: true,
    status: 'success',
    message,
    data
  });
};

export const sendError = (res: Response, message: string, status: number = 400) => {
  return res.status(status).json({
    success: false,
    status: 'error',
    message
  });
}; 