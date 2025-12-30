import { Request, Response } from 'express';

export const notFoundHandler = (_req: Request, res: Response): void => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
  });
};
