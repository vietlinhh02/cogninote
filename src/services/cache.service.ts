import { RedisClientType } from 'redis';
import { getRedis } from '../config/redis.js';
import { logger } from '../utils/logger.js';

/**
 * Cache Service
 * Handles caching operations with Redis
 */
export class CacheService {
  private redis: RedisClientType | null = null;

  private getRedisClient(): RedisClientType {
    if (!this.redis) {
      this.redis = getRedis();
    }
    return this.redis;
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.getRedisClient().get(key);
      if (!value) return null;

      return JSON.parse(value) as T;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache with optional TTL
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    try {
      const redis = this.getRedisClient();
      const serialized = JSON.stringify(value);

      if (ttlSeconds) {
        await redis.setEx(key, ttlSeconds, serialized);
      } else {
        await redis.set(key, serialized);
      }

      return true;
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      await this.getRedisClient().del(key);
      return true;
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete multiple keys matching pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    try {
      const redis = this.getRedisClient();
      const keys = await redis.keys(pattern);
      if (keys.length === 0) return 0;

      await redis.del(keys);
      return keys.length;
    } catch (error) {
      logger.error(`Cache delete pattern error for ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const exists = await this.getRedisClient().exists(key);
      return exists === 1;
    } catch (error) {
      logger.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Set expiration on existing key
   */
  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    try {
      await this.getRedisClient().expire(key, ttlSeconds);
      return true;
    } catch (error) {
      logger.error(`Cache expire error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get time to live for a key
   */
  async ttl(key: string): Promise<number> {
    try {
      return await this.getRedisClient().ttl(key);
    } catch (error) {
      logger.error(`Cache TTL error for key ${key}:`, error);
      return -1;
    }
  }

  /**
   * Increment counter
   */
  async increment(key: string, amount: number = 1): Promise<number> {
    try {
      return await this.getRedisClient().incrBy(key, amount);
    } catch (error) {
      logger.error(`Cache increment error for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Decrement counter
   */
  async decrement(key: string, amount: number = 1): Promise<number> {
    try {
      return await this.getRedisClient().decrBy(key, amount);
    } catch (error) {
      logger.error(`Cache decrement error for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get or set cached value
   * If key exists, return cached value
   * Otherwise, execute callback, cache result, and return
   */
  async getOrSet<T>(
    key: string,
    callback: () => Promise<T>,
    ttlSeconds?: number
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await callback();
    await this.set(key, value, ttlSeconds);

    return value;
  }

  /**
   * Store value in a hash
   */
  async hSet(key: string, field: string, value: any): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      await this.getRedisClient().hSet(key, field, serialized);
      return true;
    } catch (error) {
      logger.error(`Cache hSet error for key ${key}, field ${field}:`, error);
      return false;
    }
  }

  /**
   * Get value from hash
   */
  async hGet<T>(key: string, field: string): Promise<T | null> {
    try {
      const value = await this.getRedisClient().hGet(key, field);
      if (!value) return null;

      return JSON.parse(value) as T;
    } catch (error) {
      logger.error(`Cache hGet error for key ${key}, field ${field}:`, error);
      return null;
    }
  }

  /**
   * Get all fields and values from hash
   */
  async hGetAll<T>(key: string): Promise<Record<string, T>> {
    try {
      const data = await this.getRedisClient().hGetAll(key);
      const result: Record<string, T> = {};

      for (const [field, value] of Object.entries(data)) {
        result[field] = JSON.parse(value) as T;
      }

      return result;
    } catch (error) {
      logger.error(`Cache hGetAll error for key ${key}:`, error);
      return {};
    }
  }

  /**
   * Delete field from hash
   */
  async hDel(key: string, field: string): Promise<boolean> {
    try {
      await this.getRedisClient().hDel(key, field);
      return true;
    } catch (error) {
      logger.error(`Cache hDel error for key ${key}, field ${field}:`, error);
      return false;
    }
  }

  /**
   * Add item to set
   */
  async sAdd(key: string, ...members: string[]): Promise<boolean> {
    try {
      await this.getRedisClient().sAdd(key, members);
      return true;
    } catch (error) {
      logger.error(`Cache sAdd error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Remove item from set
   */
  async sRem(key: string, ...members: string[]): Promise<boolean> {
    try {
      await this.getRedisClient().sRem(key, members);
      return true;
    } catch (error) {
      logger.error(`Cache sRem error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get all members of set
   */
  async sMembers(key: string): Promise<string[]> {
    try {
      return await this.getRedisClient().sMembers(key);
    } catch (error) {
      logger.error(`Cache sMembers error for key ${key}:`, error);
      return [];
    }
  }

  /**
   * Check if member exists in set
   */
  async sIsMember(key: string, member: string): Promise<boolean> {
    try {
      return await this.getRedisClient().sIsMember(key, member);
    } catch (error) {
      logger.error(`Cache sIsMember error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Clear all cache (use with caution)
   */
  async flushAll(): Promise<boolean> {
    try {
      await this.getRedisClient().flushAll();
      logger.warn('Cache flushed: All keys deleted');
      return true;
    } catch (error) {
      logger.error('Cache flush error:', error);
      return false;
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService();
