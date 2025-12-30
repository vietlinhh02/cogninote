import { RedisClientType } from 'redis';
import { getRedis } from '../config/redis.js';
import { logger } from '../utils/logger.js';

export interface SessionData {
  userId: string;
  email: string;
  role: string;
  createdAt: Date;
  expiresAt: Date;
  [key: string]: any;
}

/**
 * Session Service
 * Handles user session management with Redis
 */
export class SessionService {
  private redis: RedisClientType;
  private readonly SESSION_PREFIX = 'session:';
  private readonly USER_SESSIONS_PREFIX = 'user_sessions:';
  private readonly DEFAULT_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

  constructor() {
    this.redis = getRedis();
  }

  /**
   * Generate session key
   */
  private getSessionKey(sessionId: string): string {
    return `${this.SESSION_PREFIX}${sessionId}`;
  }

  /**
   * Generate user sessions key
   */
  private getUserSessionsKey(userId: string): string {
    return `${this.USER_SESSIONS_PREFIX}${userId}`;
  }

  /**
   * Create a new session
   */
  async create(
    sessionId: string,
    data: Omit<SessionData, 'createdAt' | 'expiresAt'>,
    ttlSeconds: number = this.DEFAULT_TTL
  ): Promise<SessionData> {
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

      const sessionData: SessionData = {
        ...data,
        createdAt: now,
        expiresAt,
      };

      const key = this.getSessionKey(sessionId);
      await this.redis.setEx(key, ttlSeconds, JSON.stringify(sessionData));

      // Track session for user
      await this.redis.sAdd(this.getUserSessionsKey(data.userId), sessionId);
      await this.redis.expire(this.getUserSessionsKey(data.userId), ttlSeconds);

      logger.info(`Session created for user ${data.userId}`);
      return sessionData;
    } catch (error) {
      logger.error('Session creation error:', error);
      throw error;
    }
  }

  /**
   * Get session by ID
   */
  async get(sessionId: string): Promise<SessionData | null> {
    try {
      const key = this.getSessionKey(sessionId);
      const data = await this.redis.get(key);

      if (!data) return null;

      const sessionData = JSON.parse(data) as SessionData;

      // Check if session expired
      if (new Date(sessionData.expiresAt) < new Date()) {
        await this.delete(sessionId);
        return null;
      }

      return sessionData;
    } catch (error) {
      logger.error(`Session get error for ${sessionId}:`, error);
      return null;
    }
  }

  /**
   * Update session data
   */
  async update(
    sessionId: string,
    updates: Partial<Omit<SessionData, 'userId' | 'createdAt' | 'expiresAt'>>
  ): Promise<SessionData | null> {
    try {
      const session = await this.get(sessionId);
      if (!session) return null;

      const updatedSession: SessionData = {
        ...session,
        ...updates,
      };

      const key = this.getSessionKey(sessionId);
      const ttl = await this.redis.ttl(key);

      await this.redis.setEx(key, ttl > 0 ? ttl : this.DEFAULT_TTL, JSON.stringify(updatedSession));

      return updatedSession;
    } catch (error) {
      logger.error(`Session update error for ${sessionId}:`, error);
      return null;
    }
  }

  /**
   * Delete session
   */
  async delete(sessionId: string): Promise<boolean> {
    try {
      const session = await this.get(sessionId);
      if (!session) return false;

      const key = this.getSessionKey(sessionId);
      await this.redis.del(key);

      // Remove from user's session set
      await this.redis.sRem(this.getUserSessionsKey(session.userId), sessionId);

      logger.info(`Session deleted: ${sessionId}`);
      return true;
    } catch (error) {
      logger.error(`Session delete error for ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * Extend session expiration
   */
  async extend(sessionId: string, ttlSeconds: number = this.DEFAULT_TTL): Promise<boolean> {
    try {
      const session = await this.get(sessionId);
      if (!session) return false;

      const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
      const updatedSession: SessionData = {
        ...session,
        expiresAt,
      };

      const key = this.getSessionKey(sessionId);
      await this.redis.setEx(key, ttlSeconds, JSON.stringify(updatedSession));

      return true;
    } catch (error) {
      logger.error(`Session extend error for ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId: string): Promise<SessionData[]> {
    try {
      const sessionIds = await this.redis.sMembers(this.getUserSessionsKey(userId));
      const sessions: SessionData[] = [];

      for (const sessionId of sessionIds) {
        const session = await this.get(sessionId);
        if (session) {
          sessions.push(session);
        } else {
          // Clean up invalid session ID
          await this.redis.sRem(this.getUserSessionsKey(userId), sessionId);
        }
      }

      return sessions;
    } catch (error) {
      logger.error(`Get user sessions error for ${userId}:`, error);
      return [];
    }
  }

  /**
   * Delete all sessions for a user
   */
  async deleteAllUserSessions(userId: string): Promise<number> {
    try {
      const sessionIds = await this.redis.sMembers(this.getUserSessionsKey(userId));
      let deletedCount = 0;

      for (const sessionId of sessionIds) {
        const deleted = await this.delete(sessionId);
        if (deleted) deletedCount++;
      }

      // Clean up user sessions set
      await this.redis.del(this.getUserSessionsKey(userId));

      logger.info(`Deleted ${deletedCount} sessions for user ${userId}`);
      return deletedCount;
    } catch (error) {
      logger.error(`Delete all user sessions error for ${userId}:`, error);
      return 0;
    }
  }

  /**
   * Check if session exists and is valid
   */
  async exists(sessionId: string): Promise<boolean> {
    const session = await this.get(sessionId);
    return session !== null;
  }

  /**
   * Count active sessions for a user
   */
  async countUserSessions(userId: string): Promise<number> {
    try {
      const sessions = await this.getUserSessions(userId);
      return sessions.length;
    } catch (error) {
      logger.error(`Count user sessions error for ${userId}:`, error);
      return 0;
    }
  }

  /**
   * Clean up expired sessions (should be run periodically)
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      let cleanedCount = 0;
      const pattern = `${this.SESSION_PREFIX}*`;
      const keys = await this.redis.keys(pattern);

      for (const key of keys) {
        const data = await this.redis.get(key);
        if (!data) continue;

        const session = JSON.parse(data) as SessionData;
        if (new Date(session.expiresAt) < new Date()) {
          const sessionId = key.replace(this.SESSION_PREFIX, '');
          await this.delete(sessionId);
          cleanedCount++;
        }
      }

      logger.info(`Cleaned up ${cleanedCount} expired sessions`);
      return cleanedCount;
    } catch (error) {
      logger.error('Session cleanup error:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const sessionService = new SessionService();
