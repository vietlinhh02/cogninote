import { Response, NextFunction } from 'express';
import { AppError } from './error-handler.js';
import { TokenService } from '../services/token.service.js';
import { AuthenticatedRequest } from '../types/auth.types.js';

/**
 * Middleware to authenticate requests using JWT
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Access token required', 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      throw new AppError('Access token required', 401);
    }

    // Verify token
    const decoded = TokenService.verifyAccessToken(token);

    // Attach user to request
    req.user = decoded;

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Authentication failed', 401));
    }
  }
};

/**
 * Optional authentication - attaches user if token is valid but doesn't require it
 */
export const optionalAuthenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      if (token) {
        const decoded = TokenService.verifyAccessToken(token);
        req.user = decoded;
      }
    }

    next();
  } catch {
    // Continue without authentication
    next();
  }
};
