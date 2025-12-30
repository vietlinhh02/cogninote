import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { asyncLocalStorage } from '../utils/logger.js';

/**
 * Middleware to generate and attach correlation ID to each request
 * Correlation ID is used for request tracing across logs
 */
export const correlationIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // Get correlation ID from header or generate new one
  const correlationId = (req.headers['x-correlation-id'] as string) || randomUUID();

  // Set correlation ID in response header
  res.setHeader('X-Correlation-ID', correlationId);

  // Run the rest of the middleware/route handlers in the context of this correlation ID
  asyncLocalStorage.run({ correlationId }, () => {
    next();
  });
};
