import { Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { AppError } from './error-handler.js';
import { AuthenticatedRequest } from '../types/auth.types.js';

/**
 * Middleware to check if user has required role(s)
 */
export const requireRole = (...roles: Role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError('Insufficient permissions', 403);
    }

    next();
  };
};

/**
 * Middleware to check if user is admin
 */
export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  if (req.user.role !== Role.ADMIN) {
    throw new AppError('Admin access required', 403);
  }

  next();
};

/**
 * Middleware to check if user is admin or moderator
 */
export const requireAdminOrModerator = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  if (req.user.role !== Role.ADMIN && req.user.role !== Role.MODERATOR) {
    throw new AppError('Admin or moderator access required', 403);
  }

  next();
};

/**
 * Middleware to check if user is accessing their own resource
 */
export const requireOwnership = (userIdParam = 'userId') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const resourceUserId = req.params[userIdParam] || req.body[userIdParam];

    // Admins can access any resource
    if (req.user.role === Role.ADMIN) {
      next();
      return;
    }

    // Check ownership
    if (req.user.userId !== resourceUserId) {
      throw new AppError('You can only access your own resources', 403);
    }

    next();
  };
};
