import { Request, Response, NextFunction } from 'express';
import { logger, asyncLocalStorage } from '../utils/logger.js';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const store = asyncLocalStorage.getStore();
  const correlationId = store?.correlationId || res.getHeader('X-Correlation-ID');

  if (err instanceof AppError) {
    logger.error(`${err.statusCode} - ${err.message}`, {
      path: req.path,
      method: req.method,
      stack: err.stack,
    });

    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      correlationId,
    });
    return;
  }

  logger.error('Unexpected error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    correlationId,
  });
};
